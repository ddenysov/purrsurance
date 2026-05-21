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

import { config, validateConfig, getPrintableConfig, getAgentConfig } from './config.mjs';
import { 
  invokeBedrockAgent, 
  testBedrockConnection,
  invokeIntentionClassifier,
  invokeSpecificAgent 
} from './bedrockClient.mjs';
import { logger, createContextualLogger } from './logger.mjs';
import { createChatHistoryService } from './vendor/agent-tools/index.mjs';

// Initialize chat history service
const chatHistoryService = createChatHistoryService({
  tableName: process.env.CHAT_HISTORY_TABLE_NAME || 'ChatHistory',
  logger,
});

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
      'Access-Control-Allow-Origin': '*',
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
 * @param {Array<{content: string, sender: string}>} chatHistory - Chat history from frontend
 * @param {string} requestId - Request ID for logging
 * @param {Object} logger - Logger instance
 * @returns {Promise<string>} Classification result: "PolicyAgent", "VetDocAgent", or "AgentNotFoundException"
 */
async function classifyUserIntention(message, chatHistory, requestId, logger) {
  try {
    logger.info('Classifying user intention', {
      requestId,
      messageLength: message.length,
      historyLength: chatHistory ? chatHistory.length : 0,
      userMessage: message,
    });
    
    const classifierResponse = await invokeIntentionClassifier(message, chatHistory, null, logger);
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
 * @param {Object} sessionContext - Session context from chat history
 * @param {string} policyId - Policy ID from request
 * @param {string} requestId - Request ID for logging
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Agent response
 */
async function routeToAgent(classification, message, sessionId, globalSessionId, sessionContext, policyId, requestId, logger) {
  logger.info('Routing request to agent', {
    requestId,
    classification,
  });
  
  // Handle special case: no agent needed
  if (classification === 'AgentNotFoundException') {
    logger.info('No specific agent needed', { requestId });
    return {
      completion: 'Hello! I can help you with insurance policy information or veterinary consultations for your pet. How can I assist you today?',
      sessionId: sessionId || `session-${Date.now()}`,
      contentType: 'text/plain',
    };
  }
  
  // Get agent configuration from mapping
  const agentConfig = getAgentConfig(classification);
  
  if (!agentConfig) {
    logger.warn('Agent configuration not found for classification', { requestId, classification });
    return {
      completion: 'OLOLOLO I apologize, but I\'m not sure how to help with that. Could you please rephrase your question? I can assist with insurance policies or pet health concerns.',
      sessionId: sessionId || `session-${Date.now()}`,
      contentType: 'text/plain',
    };
  }
  
  // Check if agent is configured (has agentId)
  if (!agentConfig.agentId) {
    logger.warn('Agent not yet configured', { requestId, classification });
    return {
      completion: `I apologize, but the ${agentConfig.name} service is not available at the moment. Please try again later or contact our support team.`,
      sessionId: sessionId || `session-${Date.now()}`,
      contentType: 'text/plain',
    };
  }
  
  // Invoke the agent using the mapped configuration
  logger.info('Routing to agent', { 
    requestId, 
    classification,
    agentId: agentConfig.agentId,
    policyId,
  });
  
  return await invokeSpecificAgent(
    agentConfig.agentId,
    agentConfig.agentAliasId,
    message,
    sessionId,
    globalSessionId,
    sessionContext,
    policyId,
    agentConfig.name,
    logger
  );
}

/**
 * Main Lambda handler
 */
export const lambdaHandler = async (event, context) => {
  const requestId = context.requestId || 'local-' + Date.now();
  
  // Create contextual logger for this request
  const requestLogger = createContextualLogger();
  
  requestLogger.info('Processing request', {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
    isLocal: config.isLocal,
  });
  
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      requestLogger.debug('Handling CORS preflight request');
      return createResponse(200, { message: 'OK' });
    }
    
    // Parse request body
    const body = parseRequestBody(event);
    const { 
      message,
      sessionId, 
      globalSessionId,
      chatHistory,
      policyId
    } = body;
    
    // Validate input
    if (typeof message !== 'string' || message.trim().length === 0) {
      requestLogger.warn('Invalid message in request', { body });
      return createResponse(400, {
        error: 'Bad Request',
        message: 'Field "message" must be a non-empty string',
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          environment: config.environment,
          logs: requestLogger.getLogs(),
        },
      });
    }
    
    // Log chat history if available
    if (chatHistory && Array.isArray(chatHistory)) {
      requestLogger.info('Chat history received', {
        requestId,
        historyLength: chatHistory.length,
      });
    }
    
    // Initialize session context on first user request (if globalSessionId is provided)
    let sessionContext = null;
    if (globalSessionId) {
      try {
        sessionContext = await chatHistoryService.initializeSessionContext(globalSessionId);
        sessionContext = sessionContext?.context;
        requestLogger.info('Session context initialized', {
          requestId,
          sessionContext,
          sessionId: globalSessionId,
          isNewContext: !sessionContext.createdAt || sessionContext.createdAt === sessionContext.updatedAt,
        });
      } catch (error) {
        // Log error but don't fail the request
        requestLogger.error('Failed to initialize session context', {
          requestId,
          error: error.message,
        });
      }
    }
    
    // Save user message to database (if globalSessionId is provided)
    if (globalSessionId) {
      try {
        await chatHistoryService.saveChatMessage({
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
        requestLogger.error('Failed to save user message', {
          requestId,
          error: error.message,
        });
      }
    }
    
    // Step 1: Classify user intention
    const classification = await classifyUserIntention(message, chatHistory, requestId, requestLogger);
    
    // Step 2: Route to appropriate agent based on classification
    const agentResponse = await routeToAgent(
      classification,
      message,
      sessionId,
      globalSessionId,
      sessionContext,
      policyId,
      requestId,
      requestLogger
    );
    
    // Save assistant response to database (if globalSessionId is provided)
    if (globalSessionId) {
      try {
        await chatHistoryService.saveChatMessage({
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
        requestLogger.error('Failed to save assistant response', {
          requestId,
          error: error.message,
        });
      }
    } else {
      requestLogger.warn('No globalSessionId provided, skipping chat history save', {
        requestId,
      });
    }
    
    requestLogger.info('Request processed successfully', {
      requestId,
      classification,
      responseLength: agentResponse.completion.length,
    });
    
    // Return successful response with logs
    return createResponse(200, {
      message: 'Success',
      data: {
        response: agentResponse.completion,
        sessionId: agentResponse.sessionId,
      },
      metadata: {
        requestId,
        classification,
        message,
        agentId: agentResponse.agentId,
        timestamp: new Date().toISOString(),
        environment: config.environment,
        logs: requestLogger.getLogs(),
      },
    });
    
  } catch (error) {
    requestLogger.error('Error processing request', {
      requestId,
      error: error.message,
      stack: error.stack,
    });
    
    // Return error response with logs
    return createResponse(500, {
      error: 'Internal Server Error',
      message: error.message,
      requestId,
      metadata: {
        logs: requestLogger.getLogs(),
      },
    });
  }
};

/**
 * Local development server
 * Runs only when file is executed directly with node
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const http = await import('http');
  const PORT = process.env.PORT || 3002;
  
  const server = http.createServer(async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', config.cors.allowMethods);
    res.setHeader('Access-Control-Allow-Headers', config.cors.allowHeaders);
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Read request body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        // Create Lambda-like event object
        const event = {
          httpMethod: 'POST',
          path: req.url,
          body: body,
          headers: req.headers,
        };
        
        // Create Lambda-like context object
        const context = {
          requestId: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        
        // Call Lambda handler
        const response = await lambdaHandler(event, context);
        
        // Send response
        res.writeHead(response.statusCode, response.headers);
        res.end(response.body);
      } catch (error) {
        logger.error('Local server error', {
          error: error.message,
          stack: error.stack,
        });
        
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Internal Server Error',
          message: error.message,
        }));
      }
    });
  });
  
  server.listen(PORT, () => {
    logger.info('Local development server started', {
      port: PORT,
      url: `http://localhost:${PORT}`,
      environment: config.environment,
      isLocal: config.isLocal,
      useMock: false,
    });
    console.log(`\n🚀 Service Router is running on http://localhost:${PORT}`);
    console.log(`\n📝 Test with:\ncurl -X POST http://localhost:${PORT} \\\n  -H "Content-Type: application/json" \\\n  -d '{"message": "My policy id is POL-2025-123456", "globalSessionId": "test-session-123"}'\n`);
  });
}
