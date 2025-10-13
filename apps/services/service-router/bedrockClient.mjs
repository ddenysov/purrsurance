/**
 * AWS Bedrock Agent Runtime Client
 * Handles communication with AWS Bedrock Agents
 */

import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';
import {config} from './config.mjs';
import {logger} from './logger.mjs';

/**
 * Initialize Bedrock Agent Runtime Client
 */
function createBedrockClient () {
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
function getBedrockClient () {
  if (!bedrockClient) {
    bedrockClient = createBedrockClient();
  }
  return bedrockClient;
}

/**
 * Mock response for local development
 * @param {string} inputText - User input
 * @param {Object} requestLogger - Logger instance
 * @returns {Promise<Object>} Mock response
 */
async function getMockResponse (inputText, requestLogger = logger) {
  requestLogger.info('Using mock Bedrock Agent response');

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
 * @param {Object} sessionContext - Optional session context from chat history
 * @param {string} policyId - Optional policy ID from request
 * @param {string} agentName - Optional agent name for logging
 * @param {Object} requestLogger - Logger instance
 * @returns {Promise<Object>} Agent response
 */
export async function invokeSpecificAgent (agentId, agentAliasId, inputText, sessionId = null, globalSessionId = null, sessionContext = null, policyId = null, agentName = 'Bedrock Agent', requestLogger = logger) {
  try {
    // Use mock for local development if configured
    //if (config.bedrock.useMock) {
    //  return await getMockResponse(inputText, requestLogger);
    // }

    requestLogger.info(`Invoking ${agentName}`, {
      inputText: inputText,
      agentId: agentId,
      inputLength: inputText.length,
      hasSessionId: !!sessionId,
      hasGlobalSessionId: !!globalSessionId,
      hasPolicyId: !!policyId,
      policyId: policyId,
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

    // Add session attributes if globalSessionId or policyId is provided
    // This allows Lambda functions called by Bedrock Agent to access the sessionId and policyId
    if (globalSessionId || policyId) {
      commandParams.sessionState = {
        sessionAttributes: {},
      };

      if (globalSessionId) {
        commandParams.sessionState.sessionAttributes.sessionId = globalSessionId;
      }

      // Add policyId from request if available
      if (policyId) {
        commandParams.sessionState.sessionAttributes.policyId = policyId;
        requestLogger.info('Adding policyId to session attributes', {
          policyId: policyId,
        });
        commandParams.inputText = `${commandParams.inputText}`;
      }
    }

    requestLogger.debug('Bedrock Agent command parameters', {
      agentId: commandParams.agentId,
      agentAliasId: commandParams.agentAliasId,
      sessionId: commandParams.sessionId,
      sessionState: commandParams.sessionState,
      inputTextLength: commandParams.inputText.length,
      enableTrace: commandParams.enableTrace,
    });

    const command = new InvokeAgentCommand(commandParams);
    const response = await client.send(command);

    // Process the response stream
    const completion = await processResponseStream(response, requestLogger);

    requestLogger.info(`${agentName} invocation successful`, {
      completion: completion,
      sessionId: commandParams.sessionId,
      responseLength: completion.length,
      agentId: agentId,
    });

    return {
      completion: completion,
      sessionId: commandParams.sessionId,
      contentType: 'text/plain',
      agentId: agentId,
      trace: config.bedrock.sessionConfig.enableTrace ? response.trace : undefined,
    };
  } catch (error) {
    requestLogger.error(`Error invoking ${agentName}`, {
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
 * @param {Object} sessionContext - Optional session context from chat history
 * @param {string} policyId - Optional policy ID from request
 * @param {Object} requestLogger - Logger instance
 * @returns {Promise<Object>} Agent response
 */
export async function invokeBedrockAgent (inputText, sessionId = null, globalSessionId = null, sessionContext = null, policyId = null, requestLogger = logger) {
  return invokeSpecificAgent(
    config.bedrock.agentId,
    config.bedrock.agentAliasId,
    inputText,
    sessionId,
    globalSessionId,
    sessionContext,
    policyId,
    'Bedrock Agent',
    requestLogger
  );
}

/**
 * Format chat history for Bedrock Agent input
 * @param {Array<{content: string, sender: string}>} chatHistory - Chat history
 * @returns {string} Formatted chat history string
 */
function formatChatHistory (chatHistory) {
  if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
    return '';
  }

  const formattedMessages = chatHistory.map(msg => {
    const role = msg.sender === 'user' ? 'User' : 'Assistant';
    return `${role}: ${msg.content}`;
  });

  return 'Chat History:\n' + formattedMessages.join('\n') + '\n\nBased on the above conversation, classify the user intention.';
}

/**
 * Invoke Intention Classifier Agent
 * @param {string} inputText - User input text
 * @param {Array<{content: string, sender: string}>} chatHistory - Optional chat history from frontend
 * @param {string} sessionId - Optional session ID for conversation continuity
 * @param {Object} requestLogger - Logger instance
 * @returns {Promise<Object>} Agent response with classification
 */
export async function invokeIntentionClassifier (inputText, chatHistory = null, sessionId = null, requestLogger = logger) {
  // If chat history is provided, format it and prepend to input
  let formattedInput = inputText;
  if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
    const historyText = formatChatHistory(chatHistory);
    formattedInput = historyText;

    requestLogger.info('Formatted chat history for classifier', {
      historyLength: chatHistory.length,
      formattedLength: historyText.length,
    });
  }

  return invokeSpecificAgent(
    config.bedrock.intentionClassifier.agentId,
    config.bedrock.intentionClassifier.agentAliasId,
    formattedInput,
    sessionId,
    null,
    null,
    null, // policyId not needed for classifier
    'Intention Classifier Agent',
    requestLogger
  );
}


/**
 * Process the response stream from Bedrock Agent
 * @param {Object} response - Bedrock Agent response
 * @param {Object} requestLogger - Logger instance
 * @returns {Promise<string>} Processed completion text
 */
async function processResponseStream (response, requestLogger = logger) {
  const chunks = [];

  try {
    // Bedrock Agent returns a stream of chunks
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk && chunk.chunk.bytes) {
          const decodedChunk = new TextDecoder('utf-8').decode(chunk.chunk.bytes);
          chunks.push(decodedChunk);

          requestLogger.debug('Received chunk', {
            chunkSize: decodedChunk.length,
          });
        }
      }
    }

    return chunks.join('');
  } catch (error) {
    requestLogger.error('Error processing response stream', {
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
export async function testBedrockConnection () {
  try {
    logger.info('Testing Bedrock Agent connection');

    const result = await invokeBedrockAgent('Hello, this is a connection test', null, null, null, null);

    return result && result.completion && result.completion.length > 0;
  } catch (error) {
    logger.error('Bedrock connection test failed', {error: error.message});
    return false;
  }
}

