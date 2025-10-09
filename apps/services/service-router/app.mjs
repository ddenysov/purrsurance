/**
 * Lambda function handler with AWS Bedrock Agent integration
 * 
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 */

import { config, validateConfig, getPrintableConfig } from './config.mjs';
import { 
  invokeBedrockAgent, 
  testBedrockConnection,
  invokeIntentionClassifier,
  invokePolicyManagerAgent 
} from './bedrockClient.mjs';
import { logger } from './logger.mjs';
import { saveChatMessage } from './chatHistoryService.mjs';

/**
 * Initialize handler (runs once per cold start)
 */
async function initialize() {
  try {
    logger.info('Initializing Lambda function', {
      config: getPrintableConfig(),
    });
    
    // Validate configuration
    validateConfig();
    
    // Test connection in non-local environments
    if (!config.isLocal && !config.bedrock.useMock) {
      const isConnected = await testBedrockConnection();
      if (!isConnected) {
        logger.warn('Bedrock Agent connection test failed during initialization');
      }
    }
    
    logger.info('Lambda function initialized successfully');
  } catch (error) {
    logger.error('Initialization error', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

// Initialize on cold start
await initialize();

/**
 * Create standard API Gateway response
 */
function createResponse(statusCode, body, additionalHeaders = {}) {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': config.cors.allowOrigin,
      'Access-Control-Allow-Methods': config.cors.allowMethods,
      'Access-Control-Allow-Headers': config.cors.allowHeaders,
      'Access-Control-Max-Age': config.cors.maxAge.toString(),
      ...additionalHeaders,
    },
  };
}

/**
 * Parse request body
 */
function parseRequestBody(event) {
  try {
    if (!event.body) {
      return {};
    }
    
    return typeof event.body === 'string' 
      ? JSON.parse(event.body) 
      : event.body;
  } catch (error) {
    logger.error('Error parsing request body', { error: error.message });
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Classify user intention using Intention Classifier Agent
 * @param {string} message - User message
 * @param {string} requestId - Request ID for logging
 * @returns {Promise<string>} Classification result: "PolicyAgent", "VetDocAgent", or "AgentNotFoundException"
 */
async function classifyUserIntention(message, requestId) {
  try {
    logger.info('Classifying user intention', {
      requestId,
      messageLength: message.length,
    });
    
    const classifierResponse = await invokeIntentionClassifier(message);
    const classification = classifierResponse.completion.trim();
    
    logger.info('Intention classification result', {
      requestId,
      classification,
    });
    
    return classification;
  } catch (error) {
    logger.error('Error classifying user intention', {
      requestId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Route request to appropriate agent based on classification
 * @param {string} classification - Classification result from Intention Classifier
 * @param {string} message - User message
 * @param {string} sessionId - Session ID for Bedrock Agent
 * @param {string} globalSessionId - Global session ID for chat history
 * @param {string} requestId - Request ID for logging
 * @returns {Promise<Object>} Agent response
 */
async function routeToAgent(classification, message, sessionId, globalSessionId, requestId) {
  logger.info('Routing request to agent', {
    requestId,
    classification,
  });
  
  switch (classification) {
    case 'PolicyAgent':
      logger.info('Routing to Policy Manager Agent', { requestId });
      return await invokePolicyManagerAgent(message, sessionId, globalSessionId);
    
    case 'VetDocAgent':
      logger.warn('VetDocAgent not implemented yet', { requestId });
      return {
        completion: 'I apologize, but the veterinary consultation service is not available at the moment. Please try again later or contact our support team.',
        sessionId: sessionId || `session-${Date.now()}`,
        contentType: 'text/plain',
      };
    
    case 'AgentNotFoundException':
      logger.info('No specific agent needed', { requestId });
      return {
        completion: 'Hello! I can help you with insurance policy information or veterinary consultations for your pet. How can I assist you today?',
        sessionId: sessionId || `session-${Date.now()}`,
        contentType: 'text/plain',
      };
    
    default:
      logger.warn('Unknown classification result', { requestId, classification });
      return {
        completion: 'I apologize, but I\'m not sure how to help with that. Could you please rephrase your question? I can assist with insurance policies or pet health concerns.',
        sessionId: sessionId || `session-${Date.now()}`,
        contentType: 'text/plain',
      };
  }
}

/**
 * Main Lambda handler
 */
export const lambdaHandler = async (event, context) => {
  const requestId = context.requestId || 'local-' + Date.now();
  
  logger.info('Processing request', {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
    isLocal: config.isLocal,
  });
  
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      logger.debug('Handling CORS preflight request');
      return createResponse(200, { message: 'OK' });
    }
    
    // Parse request body
    const body = parseRequestBody(event);
    const { 
      message = 'My policy ID is abcd-1234',
      sessionId, 
      globalSessionId 
    } = body;
    
    // Validate input
    if (typeof message !== 'string' || message.trim().length === 0) {
      logger.warn('Invalid message in request', { body });
      return createResponse(400, {
        error: 'Bad Request',
        message: 'Field "message" must be a non-empty string',
      });
    }
    
    // Save user message to database (if globalSessionId is provided)
    if (globalSessionId) {
      try {
        await saveChatMessage({
          sessionId: globalSessionId,
          sender: 'user',
          content: message,
          bedrockSessionId: sessionId,
          metadata: {
            requestId,
            timestamp: new Date().toISOString(),
            environment: config.environment,
          },
        });
      } catch (error) {
        // Log error but don't fail the request
        logger.error('Failed to save user message', {
          requestId,
          error: error.message,
        });
      }
    }
    
    // Step 1: Classify user intention
    const classification = await classifyUserIntention(message, requestId);
    
    // Step 2: Route to appropriate agent based on classification
    const agentResponse = await routeToAgent(
      classification,
      message,
      sessionId,
      globalSessionId,
      requestId
    );
    
    // Save assistant response to database (if globalSessionId is provided)
    if (globalSessionId) {
      try {
        await saveChatMessage({
          sessionId: globalSessionId,
          sender: 'assistant',
          content: agentResponse.completion,
          bedrockSessionId: agentResponse.sessionId,
          metadata: {
            requestId,
            timestamp: new Date().toISOString(),
            environment: config.environment,
          },
        });
      } catch (error) {
        // Log error but don't fail the request
        logger.error('Failed to save assistant response', {
          requestId,
          error: error.message,
        });
      }
    } else {
      logger.warn('No globalSessionId provided, skipping chat history save', {
        requestId,
      });
    }
    
    logger.info('Request processed successfully', {
      requestId,
      classification,
      responseLength: agentResponse.completion.length,
    });
    
    // Return successful response
    return createResponse(200, {
      message: 'Success',
      data: {
        response: agentResponse.completion,
        sessionId: agentResponse.sessionId,
      },
      metadata: {
        requestId,
        classification,
        timestamp: new Date().toISOString(),
        environment: config.environment,
      },
    });
    
  } catch (error) {
    logger.error('Error processing request', {
      requestId,
      error: error.message,
      stack: error.stack,
    });
    
    // Return error response
    return createResponse(500, {
      error: 'Internal Server Error',
      message: error.message,
      requestId,
    });
  }
};
