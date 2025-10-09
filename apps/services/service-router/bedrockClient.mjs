/**
 * AWS Bedrock Agent Runtime Client
 * Handles communication with AWS Bedrock Agents
 */

import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { config } from './config.mjs';
import { logger } from './logger.mjs';

/**
 * Initialize Bedrock Agent Runtime Client
 */
function createBedrockClient() {
  // For local development, you might want to use localstack or mock
  const clientConfig = {
    region: config.bedrock.region,
  };
  
  // Add endpoint override for local testing if needed
  if (config.isLocal && process.env.BEDROCK_ENDPOINT) {
    clientConfig.endpoint = process.env.BEDROCK_ENDPOINT;
  }
  
  return new BedrockAgentRuntimeClient(clientConfig);
}

let bedrockClient = null;

/**
 * Get or create Bedrock client instance (singleton)
 */
function getBedrockClient() {
  if (!bedrockClient) {
    bedrockClient = createBedrockClient();
  }
  return bedrockClient;
}

/**
 * Mock response for local development
 * @param {string} inputText - User input
 * @returns {Promise<Object>} Mock response
 */
async function getMockResponse(inputText) {
  logger.info('Using mock Bedrock Agent response');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    completion: `Mock Agent Response: You said "${inputText}". This is a simulated response for local testing.`,
    sessionId: `mock-session-${Date.now()}`,
    contentType: 'text/plain',
  };
}

/**
 * Invoke a specific AWS Bedrock Agent by ID and Alias
 * @param {string} agentId - Bedrock Agent ID
 * @param {string} agentAliasId - Bedrock Agent Alias ID
 * @param {string} inputText - User input text
 * @param {string} sessionId - Optional session ID for conversation continuity
 * @param {string} globalSessionId - Optional global session ID for SSE event routing
 * @param {string} agentName - Optional agent name for logging
 * @returns {Promise<Object>} Agent response
 */
export async function invokeSpecificAgent(agentId, agentAliasId, inputText, sessionId = null, globalSessionId = null, agentName = 'Bedrock Agent') {
  try {
    // Use mock for local development if configured
    if (config.bedrock.useMock) {
      return await getMockResponse(inputText);
    }
    
    logger.info(`Invoking ${agentName}`, {
      agentId: agentId,
      inputLength: inputText.length,
      hasSessionId: !!sessionId,
      hasGlobalSessionId: !!globalSessionId,
    });
    
    const client = getBedrockClient();
    
    // Prepare command parameters
    const commandParams = {
      agentId: agentId,
      agentAliasId: agentAliasId,
      sessionId: sessionId || `session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      inputText: inputText,
      enableTrace: config.bedrock.sessionConfig.enableTrace,
    };
    
    // Add session attributes if globalSessionId is provided
    // This allows Lambda functions called by Bedrock Agent to access the sessionId
    if (globalSessionId) {
      commandParams.sessionState = {
        sessionAttributes: {
          sessionId: globalSessionId,
        },
      };
    }
    
    logger.debug('Bedrock Agent command parameters', commandParams);
    
    const command = new InvokeAgentCommand(commandParams);
    const response = await client.send(command);
    
    // Process the response stream
    const completion = await processResponseStream(response);
    
    logger.info(`${agentName} invocation successful`, {
      sessionId: commandParams.sessionId,
      responseLength: completion.length,
    });
    
    return {
      completion: 'Agent routed completion [' + agentId +'][' + completion + ']',
      sessionId: commandParams.sessionId,
      contentType: 'text/plain',
      trace: config.bedrock.sessionConfig.enableTrace ? response.trace : undefined,
    };
  } catch (error) {
    logger.error(`Error invoking ${agentName}`, {
      error: error.message,
      stack: error.stack,
      agentId: agentId,
    });
    
    throw new Error(`Failed to invoke ${agentName}: ${error.message}`);
  }
}

/**
 * Invoke AWS Bedrock Agent (legacy function for backward compatibility)
 * @param {string} inputText - User input text
 * @param {string} sessionId - Optional session ID for conversation continuity
 * @param {string} globalSessionId - Optional global session ID for SSE event routing
 * @returns {Promise<Object>} Agent response
 */
export async function invokeBedrockAgent(inputText, sessionId = null, globalSessionId = null) {
  return invokeSpecificAgent(
    config.bedrock.agentId,
    config.bedrock.agentAliasId,
    inputText,
    sessionId,
    globalSessionId,
    'Bedrock Agent'
  );
}

/**
 * Invoke Intention Classifier Agent
 * @param {string} inputText - User input text
 * @param {string} sessionId - Optional session ID for conversation continuity
 * @returns {Promise<Object>} Agent response with classification
 */
export async function invokeIntentionClassifier(inputText, sessionId = null) {
  return invokeSpecificAgent(
    config.bedrock.intentionClassifier.agentId,
    config.bedrock.intentionClassifier.agentAliasId,
    inputText,
    sessionId,
    null,
    'Intention Classifier Agent'
  );
}

/**
 * Invoke Policy Manager Agent
 * @param {string} inputText - User input text
 * @param {string} sessionId - Optional session ID for conversation continuity
 * @param {string} globalSessionId - Optional global session ID for SSE event routing
 * @returns {Promise<Object>} Agent response
 */
export async function invokePolicyManagerAgent(inputText, sessionId = null, globalSessionId = null) {
  return invokeSpecificAgent(
    config.bedrock.policyManager.agentId,
    config.bedrock.policyManager.agentAliasId,
    inputText,
    sessionId,
    globalSessionId,
    'Policy Manager Agent'
  );
}

/**
 * Process the response stream from Bedrock Agent
 * @param {Object} response - Bedrock Agent response
 * @returns {Promise<string>} Processed completion text
 */
async function processResponseStream(response) {
  const chunks = [];
  
  try {
    // Bedrock Agent returns a stream of chunks
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk && chunk.chunk.bytes) {
          const decodedChunk = new TextDecoder('utf-8').decode(chunk.chunk.bytes);
          chunks.push(decodedChunk);
          
          logger.debug('Received chunk', {
            chunkSize: decodedChunk.length,
          });
        }
      }
    }
    
    return chunks.join('');
  } catch (error) {
    logger.error('Error processing response stream', {
      error: error.message,
      chunksReceived: chunks.length,
    });
    
    throw new Error(`Failed to process response stream: ${error.message}`);
  }
}

/**
 * Test Bedrock Agent connection
 * Useful for health checks and debugging
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testBedrockConnection() {
  try {
    logger.info('Testing Bedrock Agent connection');
    
    const result = await invokeBedrockAgent('Hello, this is a connection test');
    
    return result && result.completion && result.completion.length > 0;
  } catch (error) {
    logger.error('Bedrock connection test failed', { error: error.message });
    return false;
  }
}

