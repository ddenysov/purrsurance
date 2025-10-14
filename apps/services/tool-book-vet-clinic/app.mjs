/**
 * BookVetClinic Lambda Function for AWS Bedrock Agent
 *
 * This function books veterinary appointments for pets.
 * It receives booking details from the Booking Manager agent and creates
 * an appointment record in the VetAppointments DynamoDB table.
 *
 * @param {Object} event - The event payload from the Bedrock Agent.
 * @returns {Object} object - The response object formatted for the Bedrock Agent.
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { sendEventToPublisher, createChatHistoryService } from "./vendor/agent-tools/index.mjs";

const eventPublisherUrl = process.env.EVENT_PUBLISHER_URL;
const chatHistoryTableName = process.env.CHAT_HISTORY_TABLE_NAME || 'ChatHistory';
const vetAppointmentsTableName = process.env.VET_APPOINTMENTS_TABLE_NAME || 'VetAppointments';

// Initialize DynamoDB clients
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Initialize Chat History Service
const chatHistory = createChatHistoryService({
  tableName: chatHistoryTableName,
  logger: console
});

/**
 * Generate unique appointment ID
 * Format: APPT-YYYY-XXXXXX
 */
function generateAppointmentId() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000; // 6-digit random number
  return `APPT-${year}-${random}`;
}

/**
 * Lambda handler for booking vet clinic appointments
 */
export const lambdaHandler = async (event, context) => {
  console.log('BookVetClinic Event:', JSON.stringify(event, null, 2));

  // Extract sessionId
  const sessionId = event.sessionState?.sessionAttributes?.sessionId || 
                    event.sessionAttributes?.sessionId || 
                    event.sessionId || 
                    'unknown-session';
  
  console.log('Session ID:', sessionId);

  // Extract parameters from the event
  const parameters = event.parameters || [];
  
  // Helper function to get parameter value
  const getParam = (name, required = false) => {
    const param = parameters.find(p => p.name === name);
    if (required && !param?.value) {
      throw new Error(`Missing required parameter: ${name}`);
    }
    return param?.value;
  };

  // Parse JSON parameter
  const parseJsonParam = (name, required = false) => {
    const value = getParam(name, required);
    if (!value) return null;
    
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      console.error(`Failed to parse ${name}:`, error);
      return value;
    }
  };

  let responseBodyContent = {
    success: false,
    message: 'Failed to book appointment'
  };

  try {
    // Extract required parameters
    const policyId = getParam('policyId', true);
    const petInfo = parseJsonParam('pet', true);
    const ownerInfo = parseJsonParam('owner', true);
    const clinicInfo = parseJsonParam('clinic', true);
    const appointmentDate = getParam('appointmentDate', true);
    const appointmentType = getParam('appointmentType', true);
    const reason = getParam('reason', true);
    
    // Extract optional parameters
    const duration = parseInt(getParam('duration') || '30');
    const notes = getParam('notes') || '';
    const preparationInstructions = getParam('preparationInstructions') || '';
    const medicalContext = parseJsonParam('medicalContext');

    // Generate appointment ID
    const appointmentId = generateAppointmentId();
    const now = new Date().toISOString();

    // Generate confirmation number (clinic-specific format)
    const clinicCode = clinicInfo.id?.split('-').slice(-1)[0] || 'VET';
    const dateCode = appointmentDate.split('T')[0].replace(/-/g, '');
    const randomCode = Math.floor(Math.random() * 900) + 100;
    const confirmationNumber = `${clinicCode}-${dateCode}-${randomCode}`;

    // Calculate arrival time (10 minutes before appointment)
    const arrivalTime = new Date(new Date(appointmentDate).getTime() - 10 * 60000).toISOString();

    // Construct the appointment object
    const appointment = {
      appointmentId,
      policyId,
      petId: petInfo.id || `PET-${Date.now()}`,
      appointmentDate,
      status: 'scheduled',
      pet: {
        id: petInfo.id || `PET-${Date.now()}`,
        name: petInfo.name,
        species: petInfo.species,
        breed: petInfo.breed,
        sex: petInfo.sex,
        dateOfBirth: petInfo.dateOfBirth,
        ageMonths: petInfo.ageMonths,
        weight: petInfo.weight || {},
        microchip: petInfo.microchip,
        spayedNeutered: petInfo.spayedNeutered,
        allergies: petInfo.allergies || [],
        conditions: petInfo.conditions || [],
        vaccinations: petInfo.vaccinations || []
      },
      owner: {
        id: ownerInfo.id,
        fullName: ownerInfo.fullName,
        phone: ownerInfo.phone,
        email: ownerInfo.email,
        address: ownerInfo.address
      },
      clinic: {
        id: clinicInfo.id,
        name: clinicInfo.name,
        address: clinicInfo.address,
        phone: clinicInfo.phone,
        email: clinicInfo.email,
        specialty: clinicInfo.specialty,
        acceptsInsurance: clinicInfo.acceptsInsurance !== false
      },
      appointment: {
        type: appointmentType,
        reason,
        appointmentDate,
        duration,
        notes,
        preparationInstructions,
        confirmationNumber,
        arrivalTime
      },
      sessionId,
      createdAt: now,
      updatedAt: now
    };

    // Add medical context if provided
    if (medicalContext) {
      appointment.medicalContext = medicalContext;
    }

    // Save appointment to DynamoDB
    const putCommand = new PutCommand({
      TableName: vetAppointmentsTableName,
      Item: appointment
    });

    await docClient.send(putCommand);

    console.log('Appointment created successfully:', {
      appointmentId,
      policyId,
      petName: petInfo.name,
      clinicName: clinicInfo.name,
      appointmentDate
    });

    // Prepare success response
    responseBodyContent = {
      success: true,
      message: 'Appointment booked successfully',
      appointment: {
        appointmentId,
        confirmationNumber,
        pet: {
          name: petInfo.name,
          species: petInfo.species,
          breed: petInfo.breed
        },
        owner: {
          name: ownerInfo.fullName,
          phone: ownerInfo.phone,
          email: ownerInfo.email
        },
        clinic: {
          name: clinicInfo.name,
          address: clinicInfo.address,
          phone: clinicInfo.phone
        },
        appointmentDate,
        arrivalTime,
        type: appointmentType,
        reason,
        duration,
        status: 'scheduled'
      }
    };

    // Send event to Event Publisher (non-blocking)
    try {
      await sendEventToPublisher(eventPublisherUrl, sessionId, {
        appointmentId,
        policyId,
        petName: petInfo.name,
        clinicName: clinicInfo.name,
        appointmentDate,
        confirmationNumber
      }, 'AppointmentBooked');
    } catch (error) {
      console.error('Failed to send event to publisher:', error);
      // Continue execution even if event publishing fails
    }

  } catch (error) {
    console.error('Failed to book appointment:', {
      sessionId,
      error: error.message,
      stack: error.stack
    });
    
    responseBodyContent = {
      success: false,
      error: error.message,
      message: `Failed to book appointment: ${error.message}`
    };
  }

  // Return response in Bedrock Agent format
  return {
    messageVersion: '1.0',
    response: {
      actionGroup: event.actionGroup,
      function: event.function,
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

