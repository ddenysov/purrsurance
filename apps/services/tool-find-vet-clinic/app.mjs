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

const snsClient = new SNSClient({});
const topicArn = process.env.EVENTS_TOPIC_ARN;
const eventPublisherUrl = process.env.EVENT_PUBLISHER_URL;

/**
 * Mock function to search for vet clinics
 * In production, this would call a real API or database
 */
function searchVetClinics() {
  // Mock data - in production this would be a real search
  const mockClinics = [
    {
      id: 'clinic-001',
      name: 'City Pet Care Center',
      address: '123 Main Street',
      city: location || 'Local Area',
      phone: '(555) 123-4567',
      rating: 4.8,
      distance: '2.3 km',
      specialty: specialty || 'General Practice',
      availability: urgency === 'urgent' ? 'Emergency services available 24/7' : 'Next available: Tomorrow 10:00 AM',
      acceptsInsurance: true
    },
    {
      id: 'clinic-002',
      name: 'Happy Paws Veterinary Hospital',
      address: '456 Oak Avenue',
      city: location || 'Local Area',
      phone: '(555) 234-5678',
      rating: 4.9,
      distance: '3.7 km',
      specialty: 'Emergency & Critical Care',
      availability: 'Open 24/7',
      acceptsInsurance: true
    },
    {
      id: 'clinic-003',
      name: 'Pet Wellness Clinic',
      address: '789 Elm Street',
      city: location || 'Local Area',
      phone: '(555) 345-6789',
      rating: 4.6,
      distance: '5.1 km',
      specialty: specialty || 'Preventive Care',
      availability: urgency === 'urgent' ? 'Walk-ins accepted' : 'Next available: 2 days',
      acceptsInsurance: true
    }
  ];

  // Filter by specialty if provided
  if (specialty && specialty !== 'any') {
    return mockClinics.filter(clinic => 
      clinic.specialty.toLowerCase().includes(specialty.toLowerCase())
    ).slice(0, 3);
  }

  return mockClinics;
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
  const location = params.location || '';
  const specialty = params.specialty || 'any';
  const urgency = params.urgency || 'normal';

  // Search for vet clinics
  const clinics = searchVetClinics();

  // Prepare response body content
  const responseBodyContent = {
    searchCriteria: {
      location: location || 'Current area',
      specialty: specialty,
      urgency: urgency
    },
    clinics: clinics,
    totalFound: clinics.length,
    timestamp: new Date().toISOString(),
    message: clinics.length > 0 
      ? `Found ${clinics.length} vet clinic${clinics.length > 1 ? 's' : ''} matching your criteria`
      : 'No clinics found matching your criteria'
  };

  // Send event to Event Publisher (non-blocking)
  await sendEventToPublisher(eventPublisherUrl, sessionId, responseBodyContent, 'FindVetClinic');
  
  // Create response using agent-tools
  return createAgentResponse(event, responseBodyContent);
};

