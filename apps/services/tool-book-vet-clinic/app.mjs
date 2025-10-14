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
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { sendEventToPublisher, createChatHistoryService } from "./vendor/agent-tools/index.mjs";

const eventPublisherUrl = process.env.EVENT_PUBLISHER_URL;
const chatHistoryTableName = process.env.CHAT_HISTORY_TABLE_NAME || 'ChatHistory';
const vetAppointmentsTableName = process.env.VET_APPOINTMENTS_TABLE_NAME || 'VetAppointments';
const policiesTableName = process.env.POLICIES_TABLE_NAME || 'Policies';

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

  // Send incoming event to publisher for debugging (non-blocking)
  try {
    await sendEventToPublisher(eventPublisherUrl, sessionId, event, 'AgentToolInvocation');
  } catch (error) {
    console.error('Failed to send agent invocation event:', error);
    // Continue execution even if event publishing fails
  }

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
    // 1. Get policyId from sessionAttributes (automatic)
    const policyId = event.sessionAttributes?.policyId;
    if (!policyId) {
      throw new Error('Policy ID not found in session attributes. Please ensure you are authenticated.');
    }
    
    console.log('Policy ID from sessionAttributes:', policyId);

    // 2. Extract required parameters (only clinicId, appointmentDate, appointmentType, reason)
    const clinicId = getParam('clinicId', true);
    const appointmentDate = getParam('appointmentDate', true);
    const appointmentType = getParam('appointmentType', true);
    const reason = getParam('reason', true);
    
    // Extract optional parameters
    const notes = getParam('notes') || '';
    const duration = 30; // Default duration

    // 3. Load policy data from Policies table to get pet and owner information
    console.log('Loading policy data from Policies table...');
    const getPolicyCommand = new GetCommand({
      TableName: policiesTableName,
      Key: { policyId }
    });
    
    const policyResult = await docClient.send(getPolicyCommand);
    
    if (!policyResult.Item) {
      throw new Error(`Policy not found: ${policyId}`);
    }
    
    const policy = policyResult.Item;
    const petInfo = policy.pet;
    const ownerInfo = policy.owner;
    
    console.log('Policy loaded:', {
      policyId,
      petName: petInfo.name,
      ownerName: ownerInfo.fullName
    });

    // 4. Get clinic information from session context
    console.log('Loading clinic from session context...');
    const sessionContext = await chatHistory.getSessionContext(sessionId);
    
    const selectedClinicData = sessionContext?.context?.contextData?.selected_clinic;
    if (!selectedClinicData || !Array.isArray(selectedClinicData) || selectedClinicData.length === 0) {
      throw new Error('Selected clinic not found in context. Please select a clinic first using FindVetClinic and save it with SaveContext.');
    }
    
    const clinicInfo = selectedClinicData[0].data;
    
    // Validate that clinicId matches
    if (clinicInfo.id !== clinicId) {
      console.warn(`Clinic ID mismatch: requested ${clinicId}, found ${clinicInfo.id} in context`);
    }
    
    console.log('Clinic loaded from context:', {
      clinicId: clinicInfo.id,
      clinicName: clinicInfo.name
    });

    // 5. Get medical context if available (from Vet Doctor agent)
    let medicalContext = null;
    const medicalContextData = sessionContext?.context?.contextData?.medical_context;
    if (medicalContextData && Array.isArray(medicalContextData) && medicalContextData.length > 0) {
      medicalContext = medicalContextData[0].data;
      console.log('Medical context found:', medicalContext);
    }

    // 6. Generate appointment ID
    const appointmentId = generateAppointmentId();
    const now = new Date().toISOString();

    // Generate confirmation number (clinic-specific format)
    const clinicCode = clinicId.split('-').slice(-1)[0] || 'VET';
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

