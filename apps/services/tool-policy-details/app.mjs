/**
 * GetPolicyDetails Lambda Function for AWS Bedrock Agent (Function Response Format)
 *
 * This function is designed for the simpler Bedrock Agent invocation method that does not use an OpenAPI schema.
 * It returns the response in the `functionResponse` format.
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

  let responseBodyContent = {};


  responseBodyContent = {
    pet: {
      id: "7f4f0c1a-6f3a-4497-9d6a-9f9d1a3a1e22",
      name: "Mittens",
      species: "cat",
      breed: "British Shorthair",
      sex: "female",
      dateOfBirth: "2021-04-15",
      ageMonths: 54,
      color: "blue",
      microchip: {
        number: "981000123456789",
        issuer: "ISO11784/11785",
        dateImplanted: "2021-06-01"
      },
      identifiers: {
        licenseTag: "KY-2025-00987",
        passportNumber: "UA-PET-000112233"
      },
      photoUrl: "https://www.shutterstock.com/image-photo/portrait-funny-white-cat-sticking-600nw-2451690317.jpg",
      weight: {
        currentKg: 4.3,
      },
      spayedNeutered: true,
      lifestyle: {
        indoor: true,
        outdoor: false,
        activityLevel: "moderate",
        diet: "wet_dry_mix"
      }
    },
    owner: {
      id: "c6c1c5b9-3c1c-4d2e-a4f1-8c1f2d9a0a55",
      fullName: "Dmytro Denysov",
      phone: "+380671112233",
      email: "dmytro@example.com",
      address: {
        country: "Ukraine",
        city: "Kyiv",
        street: "Khreshchatyk 10",
        postalCode: "01001"
      }
    },
    policy: {
      policyId: 'POL-2025-123456', // Use the extracted/default policyId
      provider: "PurrSure Insurance",
      status: "active",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      plan: "Premium",
      coverage: {
        annualLimitUAH: 150000,
        deductibleUAH: 1500,
        copayPercent: 10,
        covered: [
          "accidents",
          "illness",
          "diagnostics",
          "hospitalization",
          "surgery",
          "prescription_meds"
        ],
        exclusions: ["pre_existing_conditions", "cosmetic_procedures"]
      }
    },
    medical: {
      allergies: ["chicken_protein"],
      conditions: [
        {
          code: "ICD-11:ME81",
          name: "Feline asthma",
          diagnosedAt: "2024-02-10",
          status: "managed"
        }
      ],
      vaccinations: [
        {
          type: "RCP",
          date: "2025-02-12",
          validUntil: "2026-02-12",
          vetClinicId: "vet-kyiv-center"
        },
        {
          type: "Rabies",
          date: "2024-08-05",
          validUntil: "2027-08-05",
          vetClinicId: "vet-kyiv-center"
        }
      ],
      medications: [
        {
          name: "Fluticasone inhaler",
          dosage: "110 mcg",
          frequency: "2x/day",
          since: "2024-02-15"
        }
      ],
      lastCheckup: {
        date: "2025-09-20",
        clinic: {
          id: "vet-kyiv-center",
          name: "Kyiv Vet Center",
          phone: "+380442223344"
        },
        notes: "Normal exam; asthma stable; weight slightly up."
      },
      procedures: [
        {
          id: "proc-2025-001",
          type: "dental_cleaning",
          date: "2025-04-10",
          clinicId: "vet-kyiv-center"
        }
      ]
    },
    claims: [
      {
        claimId: "CLM-2025-000045",
        submittedAt: "2025-04-12T10:22:15Z",
        status: "paid",
        incidentDate: "2025-04-10",
        amountBilledUAH: 3200,
        amountApprovedUAH: 2880,
        amountPaidUAH: 2880,
        copayUAH: 320,
        documents: [
          {
            type: "invoice",
            url: "https://cdn.example.com/claims/CLM-2025-000045/invoice.pdf"
          }
        ]
      }
    ],
    vetContacts: [
      {
        id: "vet-kyiv-center",
        name: "Kyiv Vet Center",
        phone: "+380442223344",
        address: {city: "Kyiv", street: "Volodymyrska 25"}
      }
    ],
    audit: {
      createdAt: "2025-01-01T09:00:00Z",
      updatedAt: "2025-09-20T14:35:12Z",
      source: "core_db",
      version: 7
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

