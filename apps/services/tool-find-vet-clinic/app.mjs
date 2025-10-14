/**
 * FindVetClinic Lambda Function for AWS Bedrock Agent (Function Response Format)
 *
 * This function is designed for the simpler Bedrock Agent invocation method that does not use an OpenAPI schema.
 * It returns the response in the `functionResponse` format and publishes event to Event Publisher.
 *
 * @param {Object} event - The event payload from the Bedrock Agent.
 * @returns {Object} object - The response object formatted for the Bedrock Agent.
 */
import {SNSClient, PublishCommand} from "@aws-sdk/client-sns";
import { createAgentResponse, extractSessionId, extractParameters, sendEventToPublisher } from "./vendor/agent-tools/index.mjs";
import { mockClinics } from "./clinics-data.mjs";

const snsClient = new SNSClient({});
const topicArn = process.env.EVENTS_TOPIC_ARN;
const eventPublisherUrl = process.env.EVENT_PUBLISHER_URL;

/**
 * Mock function to search for vet clinics
 * In production, this would call a real API or database
 */
function searchVetClinics() {
  // Return random 1-3 clinics from mock data
  const count = Math.floor(Math.random() * 3) + 1; // Random number from 1 to 3
  const shuffled = [...mockClinics].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const lambdaHandler = async (event, context) => {
  // Log the incoming event for debugging
  console.log('Bedrock Agent Event (Function format):', JSON.stringify(event, null, 2));

  // Extract sessionId from event using agent-tools
  const sessionId = extractSessionId(event);
  
  console.log('Extracted sessionId:', sessionId);
  console.log('Bedrock sessionId (internal):', event.sessionId);

  // Extract parameters from the event using agent-tools
  const params = extractParameters(event);

  // Search for vet clinics
  const clinics = searchVetClinics();

  // Prepare response body content
  const responseBodyContent = {
    clinics: searchVetClinics()
  };

  // Send event to Event Publisher (non-blocking)
  await sendEventToPublisher(eventPublisherUrl, sessionId, responseBodyContent, 'FindVetClinic');
  
  // Create response using agent-tools
  return createAgentResponse(event, responseBodyContent);
};

