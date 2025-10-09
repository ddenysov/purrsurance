/**
 * GetPolicyDetails Lambda Function for AWS Bedrock Agent (Function Response Format)
 *
 * This function is designed for the simpler Bedrock Agent invocation method that does not use an OpenAPI schema.
 * It returns the response in the `functionResponse` format.
 *
 * @param {Object} event - The event payload from the Bedrock Agent.
 * @returns {Object} object - The response object formatted for the Bedrock Agent.
 */
import http from 'http';
import {SNSClient, PublishCommand} from "@aws-sdk/client-sns";

const snsClient = new SNSClient({});
const topicArn = process.env.EVENTS_TOPIC_ARN;

// Check if running locally
const IS_LOCAL = process.env.IS_LOCAL === 'true';
const PORT = process.env.PORT || 3003;

export const lambdaHandler = async (event, context) => {
  // Log the incoming event for debugging
  console.log('Bedrock Agent Event (Function format):', JSON.stringify(event, null, 2));

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
      photoUrl: process.env.DEFAULT_PET_PHOTO_URL || "",
      weight: {
        currentKg: 4.3,
        lastUpdated: "2025-09-20",
        history: [
          {date: "2025-06-20", kg: 4.1},
          {date: "2025-03-15", kg: 3.9}
        ]
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


  // This is the required response structure for the `functionResponse` format
  const agentResponse = {
    messageVersion: '1.0',
    response: {
      functionResponse: {
        responseBody: {
          // The agent expects a content type, TEXT is the simplest.
          // The body must be a string.
          'TEXT': {
            'body': JSON.stringify(responseBodyContent)
          }
        }
      }
    }
  };

  console.log('Returning Agent Response:', JSON.stringify(agentResponse, null, 2));
  return agentResponse;
};

// Local development server
if (IS_LOCAL) {
  console.log('🚀 Starting local development mode...');
  
  const server = http.createServer(async (req, res) => {
    // Enable CORS for local development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // Only accept POST requests
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Method Not Allowed',
        message: 'Only POST requests are supported',
      }));
      return;
    }
    
    // Read request body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        // Parse the request body
        const event = JSON.parse(body);
        
        // Create Lambda-like context object
        const context = {
          requestId: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          functionName: 'GetPolicyDetailsFunction',
          awsRequestId: `local-${Date.now()}`,
        };
        
        // Call Lambda handler
        const response = await lambdaHandler(event, context);
        
        // Send response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));
      } catch (error) {
        console.error('Local server error:', error.message);
        console.error(error.stack);
        
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Internal Server Error',
          message: error.message,
          stack: error.stack,
        }));
      }
    });
  });
  
  server.listen(PORT, () => {
    console.log(`\n🚀 GetPolicyDetails Service is running on http://localhost:${PORT}`);
    console.log(`\n📝 Test with:\ncurl -X POST http://localhost:${PORT} \\\n  -H "Content-Type: application/json" \\\n  -d @events/bedrock-agent-event.json\n`);
  });
}

