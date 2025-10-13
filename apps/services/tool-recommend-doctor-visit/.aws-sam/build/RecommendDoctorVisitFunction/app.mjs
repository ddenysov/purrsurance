/**
 * RecommendDoctorVisit Lambda Function for AWS Bedrock Agent (Function Response Format)
 *
 * This function is designed for the simpler Bedrock Agent invocation method that does not use an OpenAPI schema.
 * It returns the response in the `functionResponse` format and publishes event to Event Publisher.
 *
 * @param {Object} event - The event payload from the Bedrock Agent.
 * @returns {Object} object - The response object formatted for the Bedrock Agent.
 */
import {SNSClient, PublishCommand} from "@aws-sdk/client-sns";
import { createAgentResponse, extractSessionId, extractParameters, sendEventToPublisher } from "./vendor/agent-tools/index.mjs";


const snsClient = new SNSClient({});
const topicArn = process.env.EVENTS_TOPIC_ARN;
const eventPublisherUrl = process.env.EVENT_PUBLISHER_URL;

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
  const reason = parameters.find(p => p.name === 'reason')?.value || 'General health checkup recommended';
  const urgency = parameters.find(p => p.name === 'urgency')?.value || 'normal';
  const symptoms = parameters.find(p => p.name === 'symptoms')?.value || '';

  // Prepare response body content
  const responseBodyContent = {
    recommendation: {
      type: 'doctor_visit',
      reason: reason,
      urgency: urgency,
      symptoms: symptoms,
      timestamp: new Date().toISOString(),
      message: `We recommend scheduling a vet visit. Reason: ${reason}`,
    },
    nextSteps: [
      'Contact your veterinarian to schedule an appointment',
      'Prepare information about symptoms and pet behavior',
      'Bring your pet\'s medical records if available',
    ],
  };

  // Send event to Event Publisher (non-blocking)
  await sendEventToPublisher(eventPublisherUrl, sessionId, responseBodyContent, 'ReccomendDoctorVisit');

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

