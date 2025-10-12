function createAgentResponse(event, responseBodyContent) {
  const actionGroup = event.actionGroup || "UnknownActionGroup";
  const functionName = event.function || "UnknownFunction";
  return {
    messageVersion: "1.0",
    response: {
      actionGroup,
      function: functionName,
      functionResponse: {
        responseBody: {
          TEXT: {
            body: JSON.stringify(responseBodyContent, null, 2)
          }
        }
      }
    }
  };
}
function extractSessionId(event) {
  return event.sessionState?.sessionAttributes?.sessionId || event.sessionAttributes?.sessionId || event.sessionId || "unknown-session";
}
function extractParameters(event) {
  const parameters = event.parameters || [];
  return parameters.reduce((acc, param) => {
    acc[param.name] = param.value;
    return acc;
  }, {});
}
export {
  createAgentResponse,
  extractParameters,
  extractSessionId
};
