/**
 * SaveContext Lambda Function for AWS Bedrock Agent (Function Response Format)
 *
 * This function allows agents to save contextual information (diagnosis, complaints, symptoms, etc.)
 * to the session context for later retrieval and use.
 *
 * @param {Object} event - The event payload from the Bedrock Agent.
 * @returns {Object} object - The response object formatted for the Bedrock Agent.
 */
import { createAgentResponse, extractSessionId, extractParameters, sendEventToPublisher, createChatHistoryService } from "./vendor/agent-tools/index.mjs";

const eventPublisherUrl = process.env.EVENT_PUBLISHER_URL;
const chatHistoryTableName = process.env.CHAT_HISTORY_TABLE_NAME || 'ChatHistory';

// Initialize Chat History Service
const chatHistory = createChatHistoryService({
  tableName: chatHistoryTableName,
  logger: console
});

export const lambdaHandler = async (event, context) => {
  // Log the incoming event for debugging
  console.log('Bedrock Agent Event (Function format):', JSON.stringify(event, null, 2));

  // Extract sessionId from event (prioritize globalSessionId from sessionAttributes)
  const sessionId = event.sessionState?.sessionAttributes?.sessionId || 
                    event.sessionAttributes?.sessionId || 
                    event.sessionId || 
                    'unknown-session';
  
  console.log('Extracted sessionId:', sessionId);
  console.log('Bedrock sessionId (internal):', event.sessionId);

  // Extract parameters from the event
  const parameters = event.parameters || [];
  const contextKey = parameters.find(p => p.name === 'contextKey')?.value || 'general';
  const dataParam = parameters.find(p => p.name === 'data')?.value;
  const description = parameters.find(p => p.name === 'description')?.value || '';

  // Validate required parameters
  if (!dataParam) {
    const errorResponse = {
      success: false,
      error: 'Missing required parameter: data',
      message: 'The data parameter is required to save context'
    };
    
    console.error('Missing required parameter:', { sessionId, contextKey });
    
    return {
      'messageVersion': '1.0',
      'response': {
        'actionGroup': 'ContextActionGroup',
        'function': 'SaveContext',
        'functionResponse': {
          'responseBody': {
            'TEXT': {
              'body': JSON.stringify(errorResponse, null, 2),
            },
          },
        }
      }
    };
  }

  // Parse data if it's a JSON string
  let parsedData;
  try {
    parsedData = typeof dataParam === 'string' ? JSON.parse(dataParam) : dataParam;
  } catch (error) {
    // If parsing fails, use the raw value
    parsedData = dataParam;
  }

  let responseBodyContent = {
    success: false,
    message: 'Failed to save context'
  };

  // Save data to session context
  try {
    // Initialize session context if it doesn't exist
    await chatHistory.initializeSessionContext(sessionId);
    
    // Get current context
    const currentContext = await chatHistory.getSessionContext(sessionId);
    
    // Create a timestamped entry
    const timestamp = Date.now();
    const contextEntry = {
      data: parsedData,
      description: description,
      savedAt: timestamp,
      savedAtISO: new Date(timestamp).toISOString()
    };

    // Update context with the new data
    // We'll organize data by contextKey (e.g., diagnosis, complaints, symptoms)
    const contextData = currentContext.context?.contextData || {};
    
    // If the key already exists and has an array, append; otherwise create new
    if (!contextData[contextKey]) {
      contextData[contextKey] = [];
    }
    
    // Ensure it's an array
    if (!Array.isArray(contextData[contextKey])) {
      contextData[contextKey] = [contextData[contextKey]];
    }
    
    // Add new entry
    contextData[contextKey].push(contextEntry);

    const updatedContext = {
      ...currentContext.context,
      contextData: contextData,
      lastContextUpdate: timestamp
    };
    
    await chatHistory.updateSessionContext(sessionId, updatedContext);
    
    responseBodyContent = {
      success: true,
      message: `Context saved successfully under key: ${contextKey}`,
      contextKey: contextKey,
      description: description,
      timestamp: timestamp,
      savedAt: new Date(timestamp).toISOString()
    };
    
    console.log('Context saved successfully:', {
      sessionId,
      contextKey,
      description,
      timestamp
    });
  } catch (error) {
    console.error('Failed to save context:', {
      sessionId,
      contextKey,
      error: error.message,
      stack: error.stack
    });
    
    responseBodyContent = {
      success: false,
      error: error.message,
      message: 'Failed to save context to session storage'
    };
  }

  // Send event to Event Publisher (non-blocking)
  try {
    await sendEventToPublisher(eventPublisherUrl, sessionId, {
      contextKey,
      description,
      success: responseBodyContent.success
    }, 'ContextSaved');
  } catch (error) {
    console.error('Failed to send event to publisher:', error);
    // Continue execution even if event publishing fails
  }

  return {
    messageVersion: '1.0',
    response: {
      actionGroup: event.actionGroup,           // ← берём из event
      function: event.function,                 // ← берём из event
      functionResponse: {
        responseBody: {
          TEXT: {
            body: JSON.stringify(responseBodyContent, null, 2),
          },
        },
      },
      sessionAttributes: event.sessionAttributes ?? {},
      promptSessionAttributes: event.promptSessionAttributes ?? {}
    }
  };
};

