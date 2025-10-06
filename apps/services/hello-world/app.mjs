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
import { invokeBedrockAgent, testBedrockConnection } from './bedrockClient.mjs';
import { logger } from './logger.mjs';

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
      message = 'Hello, how to book a vet doctor visit??', 
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
    
    logger.info('Invoking Bedrock Agent', {
      requestId,
      messageLength: message.length,
      hasSessionId: !!sessionId,
      hasGlobalSessionId: !!globalSessionId,
    });
    
    // Invoke Bedrock Agent with session attributes
    const agentResponse = await invokeBedrockAgent(message, sessionId, globalSessionId);
    
    logger.info('Request processed successfully', {
      requestId,
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
