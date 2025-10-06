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
 * Invoke AWS Bedrock Agent
 * @param {string} inputText - User input text
 * @param {string} sessionId - Optional session ID for conversation continuity
 * @returns {Promise<Object>} Agent response
 */
export async function invokeBedrockAgent(inputText, sessionId = null) {
  try {
    // Use mock for local development if configured
    if (config.bedrock.useMock) {
      return await getMockResponse(inputText);
    }
    
    logger.info('Invoking Bedrock Agent', {
      agentId: config.bedrock.agentId,
      inputLength: inputText.length,
      hasSessionId: !!sessionId,
    });
    
    const client = getBedrockClient();
    
    // Prepare command parameters
    const commandParams = {
      agentId: config.bedrock.agentId,
      agentAliasId: config.bedrock.agentAliasId,
      sessionId: sessionId || `session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      inputText: inputText,
      enableTrace: config.bedrock.sessionConfig.enableTrace,
    };
    
    logger.debug('Bedrock Agent command parameters', commandParams);
    
    const command = new InvokeAgentCommand(commandParams);
    const response = await client.send(command);
    
    // Process the response stream
    const completion = await processResponseStream(response);
    
    logger.info('Bedrock Agent invocation successful', {
      sessionId: commandParams.sessionId,
      responseLength: completion.length,
    });
    
    return {
      completion: completion,
      sessionId: commandParams.sessionId,
      contentType: 'text/plain',
      trace: config.bedrock.sessionConfig.enableTrace ? response.trace : undefined,
    };
  } catch (error) {
    logger.error('Error invoking Bedrock Agent', {
      error: error.message,
      stack: error.stack,
      agentId: config.bedrock.agentId,
    });
    
    throw new Error(`Failed to invoke Bedrock Agent: ${error.message}`);
  }
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

