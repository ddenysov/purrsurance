/**
 * Seed: VetAppointments Table
 * 
 * Populates the VetAppointments table with sample appointment data
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "VetAppointments";

/**
 * Sample appointment data
 */
const appointments = [
  {
    appointmentId: "APPT-2025-001001",
    policyId: "POL-2025-123456",
    petId: "PET-2025-001",
    appointmentDate: "2025-10-25T10:00:00.000Z",
    status: "scheduled",
    pet: {
      id: "PET-2025-001",
      name: "Mittens",
      species: "cat",
      breed: "Siamese",
      sex: "female",
      dateOfBirth: "2020-03-15",
      ageMonths: 67,
      weight: {
        currentKg: 4.2
      },
      spayedNeutered: true,
      allergies: ["penicillin"],
      vaccinations: [
        {
          type: "RCP",
          date: "2024-03-15",
          validUntil: "2025-03-15"
        },
        {
          type: "Rabies",
          date: "2024-03-15",
          validUntil: "2027-03-15"
        }
      ]
    },
    owner: {
      id: "c6c1c5b9-3c1c-4d2e-a4f1-8c1f2d9a0a55",
      fullName: "Sarah Johnson",
      phone: "+380501234567",
      email: "sarah.johnson@example.com",
      address: {
        country: "Ukraine",
        city: "Kyiv",
        street: "Khreshchatyk St, 22",
        postalCode: "01001"
      }
    },
    clinic: {
      id: "CLINIC-KV-001",
      name: "City Veterinary Clinic",
      address: {
        street: "Shevchenka St, 45",
        city: "Kyiv",
        postalCode: "02000",
        country: "Ukraine"
      },
      phone: "+380441234567",
      email: "info@cityvets.ua",
      specialty: "General",
      acceptsInsurance: true
    },
    appointment: {
      type: "routine",
      reason: "Annual checkup and vaccination booster",
      appointmentDate: "2025-10-25T10:00:00.000Z",
      duration: 30,
      notes: "Annual wellness exam",
      preparationInstructions: "Please bring vaccination records and insurance card",
      confirmationNumber: "CVT-20251025-001",
      arrivalTime: "2025-10-25T09:50:00.000Z"
    },
    sessionId: "session-seed-001",
    createdAt: "2025-10-14T10:00:00.000Z",
    updatedAt: "2025-10-14T10:00:00.000Z"
  },
  {
    appointmentId: "APPT-2025-001002",
    policyId: "POL-2025-234567",
    petId: "PET-2025-002",
    appointmentDate: "2025-10-22T14:30:00.000Z",
    status: "confirmed",
    pet: {
      id: "PET-2025-002",
      name: "Max",
      species: "dog",
      breed: "Golden Retriever",
      sex: "male",
      dateOfBirth: "2019-06-10",
      ageMonths: 76,
      weight: {
        currentKg: 32.0
      },
      spayedNeutered: true,
      conditions: ["hip dysplasia"],
      vaccinations: [
        {
          type: "DHPP",
          date: "2024-06-10",
          validUntil: "2025-06-10"
        },
        {
          type: "Rabies",
          date: "2024-06-10",
          validUntil: "2027-06-10"
        }
      ]
    },
    owner: {
      id: "d7d2d6c0-4d2d-5e3f-b5g2-9d2g3e0b1b66",
      fullName: "Michael Brown",
      phone: "+380672345678",
      email: "michael.brown@example.com",
      address: {
        country: "Ukraine",
        city: "Lviv",
        street: "Svobody Ave, 15",
        postalCode: "79000"
      }
    },
    clinic: {
      id: "CLINIC-LV-001",
      name: "Pet Care Center Lviv",
      address: {
        street: "Lychakivska St, 78",
        city: "Lviv",
        postalCode: "79008",
        country: "Ukraine"
      },
      phone: "+380322345678",
      email: "contact@petcarelviv.ua",
      specialty: "Orthopedics",
      acceptsInsurance: true
    },
    appointment: {
      type: "specialist",
      reason: "Hip dysplasia follow-up examination",
      appointmentDate: "2025-10-22T14:30:00.000Z",
      duration: 45,
      notes: "Bring previous X-rays if available",
      preparationInstructions: "8-hour fasting required for potential sedation",
      confirmationNumber: "PCC-20251022-015",
      arrivalTime: "2025-10-22T14:15:00.000Z"
    },
    medicalContext: {
      diagnosis: "Chronic hip dysplasia requiring monitoring",
      symptoms: ["limping", "difficulty standing"],
      assessment: "Stable condition but needs regular check-ups",
      urgencyLevel: "normal",
      visitRecommendation: "Orthopedic specialist for evaluation",
      petCondition: "Manageable with current medication",
      savedAt: "2025-10-14T08:30:00.000Z"
    },
    sessionId: "session-seed-002",
    createdAt: "2025-10-14T09:00:00.000Z",
    updatedAt: "2025-10-14T11:00:00.000Z"
  },
  {
    appointmentId: "APPT-2025-001003",
    policyId: "POL-2025-345678",
    petId: "PET-2025-003",
    appointmentDate: "2025-10-15T16:00:00.000Z",
    status: "completed",
    pet: {
      id: "PET-2025-003",
      name: "Luna",
      species: "cat",
      breed: "Persian",
      sex: "female",
      dateOfBirth: "2021-02-20",
      ageMonths: 56,
      weight: {
        currentKg: 3.8
      },
      spayedNeutered: true,
      allergies: ["grass pollen"],
      vaccinations: [
        {
          type: "RCP",
          date: "2024-02-20",
          validUntil: "2025-02-20"
        },
        {
          type: "Rabies",
          date: "2024-02-20",
          validUntil: "2027-02-20"
        }
      ]
    },
    owner: {
      id: "e8e3e7d1-5e3e-6f4g-c6h3-0e3h4f1c2c77",
      fullName: "Anna Kovalenko",
      phone: "+380933456789",
      email: "anna.kovalenko@example.com",
      address: {
        country: "Ukraine",
        city: "Odesa",
        street: "Derybasivska St, 8",
        postalCode: "65000"
      }
    },
    clinic: {
      id: "CLINIC-OD-001",
      name: "Odesa Emergency Vet",
      address: {
        street: "Preobrazhenska St, 12",
        city: "Odesa",
        postalCode: "65014",
        country: "Ukraine"
      },
      phone: "+380482456789",
      email: "emergency@odesavet.ua",
      specialty: "Emergency",
      acceptsInsurance: true
    },
    appointment: {
      type: "urgent",
      reason: "Persistent vomiting and lethargy",
      appointmentDate: "2025-10-15T16:00:00.000Z",
      duration: 60,
      notes: "Brought in due to acute symptoms. Received IV fluids and anti-nausea medication. Recovered well.",
      confirmationNumber: "OEV-20251015-089",
      arrivalTime: "2025-10-15T15:45:00.000Z"
    },
    medicalContext: {
      diagnosis: "Acute gastroenteritis",
      symptoms: ["vomiting", "lethargy", "loss of appetite"],
      assessment: "Likely caused by dietary indiscretion. Responded well to treatment.",
      urgencyLevel: "urgent",
      visitRecommendation: "Emergency vet for immediate care",
      petCondition: "Showing signs of dehydration, needs immediate attention",
      savedAt: "2025-10-15T14:30:00.000Z"
    },
    sessionId: "session-seed-003",
    createdAt: "2025-10-15T14:30:00.000Z",
    updatedAt: "2025-10-15T18:00:00.000Z"
  },
  {
    appointmentId: "APPT-2025-001004",
    policyId: "POL-2025-456789",
    petId: "PET-2025-004",
    appointmentDate: "2025-10-28T11:00:00.000Z",
    status: "scheduled",
    pet: {
      id: "PET-2025-004",
      name: "Rocky",
      species: "dog",
      breed: "German Shepherd",
      sex: "male",
      dateOfBirth: "2022-08-05",
      ageMonths: 38,
      weight: {
        currentKg: 38.5
      },
      spayedNeutered: true,
      vaccinations: [
        {
          type: "DHPP",
          date: "2024-08-05",
          validUntil: "2025-08-05"
        },
        {
          type: "Rabies",
          date: "2024-08-05",
          validUntil: "2027-08-05"
        }
      ]
    },
    owner: {
      id: "f9f4f8e2-6f4f-7g5h-d7i4-1f4i5g2d3d88",
      fullName: "Viktor Petrov",
      phone: "+380504567890",
      email: "viktor.petrov@example.com",
      address: {
        country: "Ukraine",
        city: "Dnipro",
        street: "Naberezhna Peremogy St, 50",
        postalCode: "49000"
      }
    },
    clinic: {
      id: "CLINIC-DN-001",
      name: "Dnipro Animal Hospital",
      address: {
        street: "Haharina Ave, 120",
        city: "Dnipro",
        postalCode: "49044",
        country: "Ukraine"
      },
      phone: "+380562567890",
      email: "info@dniprovets.ua",
      specialty: "General",
      acceptsInsurance: true
    },
    appointment: {
      type: "routine",
      reason: "Dental cleaning and examination",
      appointmentDate: "2025-10-28T11:00:00.000Z",
      duration: 90,
      notes: "First dental cleaning",
      preparationInstructions: "12-hour fasting required. No water after 8 AM.",
      confirmationNumber: "DAH-20251028-042",
      arrivalTime: "2025-10-28T10:45:00.000Z"
    },
    sessionId: "session-seed-004",
    createdAt: "2025-10-14T13:00:00.000Z",
    updatedAt: "2025-10-14T13:00:00.000Z"
  },
  {
    appointmentId: "APPT-2025-001005",
    policyId: "POL-2025-123456",
    petId: "PET-2025-001",
    appointmentDate: "2025-09-15T09:30:00.000Z",
    status: "completed",
    pet: {
      id: "PET-2025-001",
      name: "Mittens",
      species: "cat",
      breed: "Siamese",
      sex: "female",
      dateOfBirth: "2020-03-15",
      ageMonths: 66,
      weight: {
        currentKg: 4.0
      },
      spayedNeutered: true,
      allergies: ["penicillin"]
    },
    owner: {
      id: "c6c1c5b9-3c1c-4d2e-a4f1-8c1f2d9a0a55",
      fullName: "Sarah Johnson",
      phone: "+380501234567",
      email: "sarah.johnson@example.com",
      address: {
        country: "Ukraine",
        city: "Kyiv",
        street: "Khreshchatyk St, 22",
        postalCode: "01001"
      }
    },
    clinic: {
      id: "CLINIC-KV-001",
      name: "City Veterinary Clinic",
      address: {
        street: "Shevchenka St, 45",
        city: "Kyiv",
        postalCode: "02000",
        country: "Ukraine"
      },
      phone: "+380441234567",
      email: "info@cityvets.ua",
      specialty: "General",
      acceptsInsurance: true
    },
    appointment: {
      type: "follow-up",
      reason: "Post-surgery checkup",
      appointmentDate: "2025-09-15T09:30:00.000Z",
      duration: 20,
      notes: "Healing well. Stitches removed. Full recovery expected.",
      confirmationNumber: "CVT-20250915-024",
      arrivalTime: "2025-09-15T09:20:00.000Z"
    },
    sessionId: "session-seed-005",
    createdAt: "2025-09-10T10:00:00.000Z",
    updatedAt: "2025-09-15T10:00:00.000Z"
  },
  {
    appointmentId: "APPT-2025-001006",
    policyId: "POL-2025-567890",
    petId: "PET-2025-005",
    appointmentDate: "2025-10-18T15:00:00.000Z",
    status: "cancelled",
    pet: {
      id: "PET-2025-005",
      name: "Whiskers",
      species: "cat",
      breed: "Maine Coon",
      sex: "male",
      dateOfBirth: "2018-11-12",
      ageMonths: 83,
      weight: {
        currentKg: 7.2
      },
      spayedNeutered: true
    },
    owner: {
      id: "g0g5g9f3-7g5g-8h6i-e8j5-2g5j6h3e4e99",
      fullName: "Olena Shevchenko",
      phone: "+380675678901",
      email: "olena.shevchenko@example.com",
      address: {
        country: "Ukraine",
        city: "Kharkiv",
        street: "Sumska St, 25",
        postalCode: "61000"
      }
    },
    clinic: {
      id: "CLINIC-KH-001",
      name: "Kharkiv Pet Clinic",
      address: {
        street: "Pushkinska St, 80",
        city: "Kharkiv",
        postalCode: "61057",
        country: "Ukraine"
      },
      phone: "+380577678901",
      email: "reception@kharkivpets.ua",
      specialty: "General",
      acceptsInsurance: true
    },
    appointment: {
      type: "routine",
      reason: "Vaccination update",
      appointmentDate: "2025-10-18T15:00:00.000Z",
      duration: 15,
      notes: "Owner cancelled due to scheduling conflict. Rescheduling requested.",
      confirmationNumber: "KPC-20251018-056",
      arrivalTime: "2025-10-18T14:50:00.000Z"
    },
    sessionId: "session-seed-006",
    createdAt: "2025-10-12T14:00:00.000Z",
    updatedAt: "2025-10-14T09:30:00.000Z"
  }
];

export async function seed() {
  console.log(`Seeding table: ${TABLE_NAME}...`);

  try {
    // Check if table already has data
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      Limit: 1
    });
    
    const existingData = await docClient.send(scanCommand);
    
    if (existingData.Items && existingData.Items.length > 0) {
      console.log(`⚠ Table ${TABLE_NAME} already contains data. Skipping seed.`);
      console.log(`  To reseed, delete all items first.`);
      return;
    }

    // Insert appointments
    let successCount = 0;
    let errorCount = 0;

    for (const appointment of appointments) {
      try {
        const command = new PutCommand({
          TableName: TABLE_NAME,
          Item: appointment
        });

        await docClient.send(command);
        successCount++;
        console.log(`  ✓ Added appointment: ${appointment.appointmentId} (${appointment.pet.name})`);
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Failed to add appointment ${appointment.appointmentId}:`, error.message);
      }
    }

    console.log(`\n✓ Seeding completed:`);
    console.log(`  - Successfully added: ${successCount} appointments`);
    if (errorCount > 0) {
      console.log(`  - Failed: ${errorCount} appointments`);
    }

  } catch (error) {
    console.error(`✗ Failed to seed table ${TABLE_NAME}:`, error.message);
    throw error;
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => {
      console.log('\n✓ Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Seed failed:', error);
      process.exit(1);
    });
}

