/**
 * Agent Response Utilities
 * 
 * Common utilities for formatting AWS Bedrock Agent responses
 */

/**
 * Create a standardized agent function response
 * 
 * @param {Object} event - The event payload from the Bedrock Agent
 * @param {Object} responseBodyContent - The content to return in the response body
 * @returns {Object} Formatted response object for Bedrock Agent
 */
export function createAgentResponse(event, responseBodyContent) {
  // Extract action group and function name from event
  const actionGroup = event.actionGroup || 'UnknownActionGroup';
  const functionName = event.function || 'UnknownFunction';

  return {
    messageVersion: '1.0',
    response: {
      actionGroup: actionGroup,
      function: functionName,
      functionResponse: {
        responseBody: {
          TEXT: {
            body: JSON.stringify(responseBodyContent, null, 2),
          },
        },
      },
    },
  };
}

/**
 * Extract session ID from event with fallback logic
 * 
 * @param {Object} event - The event payload from the Bedrock Agent
 * @returns {string} Session ID
 */
export function extractSessionId(event) {
  return (
    event.sessionState?.sessionAttributes?.sessionId ||
    event.sessionAttributes?.sessionId ||
    event.sessionId ||
    'unknown-session'
  );
}

/**
 * Extract parameters from event as a key-value object
 * 
 * @param {Object} event - The event payload from the Bedrock Agent
 * @returns {Object} Parameters as key-value pairs
 */
export function extractParameters(event) {
  const parameters = event.parameters || [];
  return parameters.reduce((acc, param) => {
    acc[param.name] = param.value;
    return acc;
  }, {});
}

