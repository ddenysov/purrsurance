/**
 * GetPolicyDetails Lambda Function for AWS Bedrock Agent (Function Response Format)
 *
 * This function is designed for the simpler Bedrock Agent invocation method that does not use an OpenAPI schema.
 * It returns the response in the `functionResponse` format.
 *
 * @param {Object} event - The event payload from the Bedrock Agent.
 * @returns {Object} object - The response object formatted for the Bedrock Agent.
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createAgentResponse, extractSessionId, extractParameters, sendEventToPublisher, createChatHistoryService } from "./vendor/agent-tools/index.mjs";

const eventPublisherUrl = process.env.EVENT_PUBLISHER_URL;
const chatHistoryTableName = process.env.CHAT_HISTORY_TABLE_NAME || 'ChatHistory';
const policiesTableName = process.env.POLICIES_TABLE_NAME || 'Policies';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Initialize Chat History Service
const chatHistory = createChatHistoryService({
  tableName: chatHistoryTableName,
  logger: console
});

/**
 * Extract policyId parameter from event
 * @param {Object} event - Bedrock Agent event
 * @returns {string|null} - The policyId or null if not found
 */
function extractPolicyId(event) {
  if (!event.parameters || !Array.isArray(event.parameters)) {
    return null;
  }
  
  const policyIdParam = event.parameters.find(param => param.name === 'policyId');
  return policyIdParam?.value || null;
}

/**
 * Fetch policy details from DynamoDB
 * @param {string} policyId - The policy ID to fetch
 * @returns {Object|null} - The policy data or null if not found
 */
async function getPolicyFromDatabase(policyId) {
  try {
    const command = new GetCommand({
      TableName: policiesTableName,
      Key: { policyId }
    });
    
    const result = await docClient.send(command);
    return result.Item || null;
  } catch (error) {
    console.error('Error fetching policy from database:', {
      policyId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

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

  // Extract policyId from parameters
  const policyId = extractPolicyId(event);
  console.log('Extracted policyId:', policyId);

  let responseBodyContent = {};

  // Validate policyId
  if (!policyId) {
    console.error('Missing policyId parameter');
    return {
      messageVersion: '1.0',
      response: {
        actionGroup: event.actionGroup,
        function: event.function,
        functionResponse: {
          responseBody: {
            TEXT: {
              body: JSON.stringify({
                error: 'Missing required parameter: policyId',
                message: 'Please provide a valid policy ID'
              }, null, 2),
            },
          },
        },
        sessionAttributes: event.sessionAttributes ?? {},
        promptSessionAttributes: event.promptSessionAttributes ?? {}
      }
    };
  }

  // Fetch policy data from database
  let policyData;
  try {
    policyData = await getPolicyFromDatabase(policyId);
    
    if (!policyData) {
      console.error('Policy not found:', policyId);
      return {
        messageVersion: '1.0',
        response: {
          actionGroup: event.actionGroup,
          function: event.function,
          functionResponse: {
            responseBody: {
              TEXT: {
                body: JSON.stringify({
                  error: 'Policy not found',
                  message: `No policy found with ID: ${policyId}`
                }, null, 2),
              },
            },
          },
          sessionAttributes: event.sessionAttributes ?? {},
          promptSessionAttributes: event.promptSessionAttributes ?? {}
        }
      };
    }

    console.log('Policy data retrieved successfully:', policyId);
  } catch (error) {
    console.error('Database error:', error);
    return {
      messageVersion: '1.0',
      response: {
        actionGroup: event.actionGroup,
        function: event.function,
        functionResponse: {
          responseBody: {
            TEXT: {
              body: JSON.stringify({
                error: 'Database error',
                message: 'Failed to retrieve policy data. Please try again later.'
              }, null, 2),
            },
          },
        },
        sessionAttributes: event.sessionAttributes ?? {},
        promptSessionAttributes: event.promptSessionAttributes ?? {}
      }
    };
  }

  // Use data from database
  // Extract vet contacts from medical history
  const vetContacts = [];
  if (policyData.medical?.lastCheckup?.clinic) {
    vetContacts.push(policyData.medical.lastCheckup.clinic);
  }

  responseBodyContent = {
    pet: policyData.pet,
    owner: policyData.owner,
    policy: policyData.policy,
    medical: policyData.medical,
    claims: policyData.claims || [],
    vetContacts: vetContacts,
    audit: {
      createdAt: policyData.createdAt,
      updatedAt: policyData.updatedAt,
      source: "dynamodb",
      version: 1
    }
  };

  // Save policy details to session context
  try {
    // Initialize session context if it doesn't exist
    await chatHistory.initializeSessionContext(sessionId);
    
    // Get current context
    const currentContext = await chatHistory.getSessionContext(sessionId);
    
    const timestamp = Date.now();
    const timestampISO = new Date(timestamp).toISOString();
    
    // Get existing contextData or initialize
    const contextData = currentContext.context?.contextData || {};
    
    // Save pet information
    contextData.pet = [{
      data: responseBodyContent.pet,
      description: 'Pet information retrieved from policy details',
      savedAt: timestamp,
      savedAtISO: timestampISO
    }];
    
    // Save owner information
    contextData.owner = [{
      data: responseBodyContent.owner,
      description: 'Pet owner information retrieved from policy details',
      savedAt: timestamp,
      savedAtISO: timestampISO
    }];
    
    // Save policy information
    contextData.policy = [{
      data: responseBodyContent.policy,
      description: 'Insurance policy information',
      savedAt: timestamp,
      savedAtISO: timestampISO
    }];
    
    // Save medical information
    contextData.medical = [{
      data: responseBodyContent.medical,
      description: 'Pet medical history and records',
      savedAt: timestamp,
      savedAtISO: timestampISO
    }];
    
    // Update context with structured data
    const updatedContext = {
      ...currentContext.context,
      contextData: contextData,
      policyDetails: responseBodyContent,
      pet: responseBodyContent.pet,
      petOwner: responseBodyContent.owner,
      lastContextUpdate: timestamp,
      policyDetailsUpdatedAt: timestamp
    };
    
    await chatHistory.updateSessionContext(sessionId, updatedContext);
    
    console.log('Policy details saved to session context:', {
      sessionId,
      timestamp,
      savedKeys: ['pet', 'owner', 'policy', 'medical']
    });
  } catch (error) {
    console.error('Failed to save policy details to context:', {
      sessionId,
      error: error.message,
      stack: error.stack
    });
    // Continue execution even if context save fails
  }

  // Send event to Event Publisher (non-blocking)
  await sendEventToPublisher(eventPublisherUrl, sessionId, responseBodyContent, 'PolicyDetailsRetrieved');

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

