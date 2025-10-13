/**
 * Seed: Insurance Policies
 * 
 * Seeds the Policies table with mock data for 10 different pet insurance policies
 * (mix of cats and dogs with various characteristics)
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "Policies";

// Mock policies data - 10 policies with different pets
const policies = [
  {
    policyId: "POL-2025-123456",
    ownerId: "c6c1c5b9-3c1c-4d2e-a4f1-8c1f2d9a0a55",
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
      photoUrl: "https://images.unsplash.com/photo-1574158622682-e40e69881006",
      weight: { currentKg: 4.3 },
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
      policyId: "POL-2025-123456",
      provider: "PurrSure Insurance",
      status: "active",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      plan: "Premium",
      coverage: {
        annualLimitUAH: 150000,
        deductibleUAH: 1500,
        copayPercent: 10,
        covered: ["accidents", "illness", "diagnostics", "hospitalization", "surgery", "prescription_meds"],
        exclusions: ["pre_existing_conditions", "cosmetic_procedures"]
      }
    },
    medical: {
      allergies: ["chicken_protein"],
      conditions: [{
        code: "ICD-11:ME81",
        name: "Feline asthma",
        diagnosedAt: "2024-02-10",
        status: "managed"
      }],
      vaccinations: [
        {
          type: "RCP",
          date: "2025-02-12",
          validUntil: "2026-02-12",
          vetClinicId: "vet-kyiv-center"
        }
      ],
      medications: [{
        name: "Fluticasone inhaler",
        dosage: "110 mcg",
        frequency: "2x/day",
        since: "2024-02-15"
      }],
      lastCheckup: {
        date: "2025-09-20",
        clinic: {
          id: "vet-kyiv-center",
          name: "Kyiv Vet Center",
          phone: "+380442223344"
        },
        notes: "Normal exam; asthma stable; weight slightly up."
      }
    },
    status: "active",
    createdAt: "2025-01-01T09:00:00Z",
    updatedAt: "2025-09-20T14:35:12Z"
  },
  {
    policyId: "POL-2025-234567",
    ownerId: "a1b2c3d4-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
    pet: {
      id: "8e5e1c2b-7f4a-5598-0e7b-0g0e2b4b2f33",
      name: "Max",
      species: "dog",
      breed: "Golden Retriever",
      sex: "male",
      dateOfBirth: "2020-06-20",
      ageMonths: 64,
      color: "golden",
      microchip: {
        number: "981000234567890",
        issuer: "ISO11784/11785",
        dateImplanted: "2020-08-15"
      },
      identifiers: {
        licenseTag: "KY-2025-11223",
        passportNumber: "UA-PET-000223344"
      },
      photoUrl: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24",
      weight: { currentKg: 32.5 },
      spayedNeutered: true,
      lifestyle: {
        indoor: true,
        outdoor: true,
        activityLevel: "high",
        diet: "dry_food"
      }
    },
    owner: {
      id: "a1b2c3d4-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
      fullName: "Olena Kovalenko",
      phone: "+380672223344",
      email: "olena.k@example.com",
      address: {
        country: "Ukraine",
        city: "Kyiv",
        street: "Shevchenka 25",
        postalCode: "01004"
      }
    },
    policy: {
      policyId: "POL-2025-234567",
      provider: "PurrSure Insurance",
      status: "active",
      startDate: "2025-02-15",
      endDate: "2026-02-15",
      plan: "Standard",
      coverage: {
        annualLimitUAH: 100000,
        deductibleUAH: 2000,
        copayPercent: 20,
        covered: ["accidents", "illness", "diagnostics", "hospitalization", "surgery"],
        exclusions: ["pre_existing_conditions", "cosmetic_procedures", "breeding"]
      }
    },
    medical: {
      allergies: [],
      conditions: [],
      vaccinations: [
        {
          type: "DHPP",
          date: "2025-01-10",
          validUntil: "2026-01-10",
          vetClinicId: "vet-kyiv-pets"
        },
        {
          type: "Rabies",
          date: "2024-06-20",
          validUntil: "2027-06-20",
          vetClinicId: "vet-kyiv-pets"
        }
      ],
      medications: [],
      lastCheckup: {
        date: "2025-08-15",
        clinic: {
          id: "vet-kyiv-pets",
          name: "Kyiv Pets Clinic",
          phone: "+380443334455"
        },
        notes: "Healthy, active dog. All vitals normal."
      }
    },
    status: "active",
    createdAt: "2025-02-15T10:00:00Z",
    updatedAt: "2025-08-15T11:20:00Z"
  },
  {
    policyId: "POL-2025-345678",
    ownerId: "b2c3d4e5-6f7g-8h9i-0j1k-2l3m4n5o6p7q",
    pet: {
      id: "9f6f2d3c-8g5b-6609-1f8c-1h1f3c5c3g44",
      name: "Luna",
      species: "cat",
      breed: "Persian",
      sex: "female",
      dateOfBirth: "2022-03-10",
      ageMonths: 43,
      color: "white",
      microchip: {
        number: "981000345678901",
        issuer: "ISO11784/11785",
        dateImplanted: "2022-05-01"
      },
      identifiers: {
        licenseTag: "LV-2025-22334",
        passportNumber: "UA-PET-000334455"
      },
      photoUrl: "https://images.unsplash.com/photo-1595433707802-6b2626ef1c91",
      weight: { currentKg: 3.8 },
      spayedNeutered: true,
      lifestyle: {
        indoor: true,
        outdoor: false,
        activityLevel: "low",
        diet: "wet_food"
      }
    },
    owner: {
      id: "b2c3d4e5-6f7g-8h9i-0j1k-2l3m4n5o6p7q",
      fullName: "Andriy Petrenko",
      phone: "+380673334455",
      email: "andriy.p@example.com",
      address: {
        country: "Ukraine",
        city: "Lviv",
        street: "Franka 15",
        postalCode: "79000"
      }
    },
    policy: {
      policyId: "POL-2025-345678",
      provider: "PurrSure Insurance",
      status: "active",
      startDate: "2025-03-01",
      endDate: "2026-03-01",
      plan: "Premium",
      coverage: {
        annualLimitUAH: 150000,
        deductibleUAH: 1500,
        copayPercent: 10,
        covered: ["accidents", "illness", "diagnostics", "hospitalization", "surgery", "prescription_meds", "dental"],
        exclusions: ["pre_existing_conditions", "cosmetic_procedures"]
      }
    },
    medical: {
      allergies: [],
      conditions: [{
        code: "ICD-11:KA21",
        name: "Polycystic kidney disease",
        diagnosedAt: "2024-11-05",
        status: "monitored"
      }],
      vaccinations: [
        {
          type: "RCP",
          date: "2025-03-10",
          validUntil: "2026-03-10",
          vetClinicId: "vet-lviv-care"
        }
      ],
      medications: [],
      lastCheckup: {
        date: "2025-09-10",
        clinic: {
          id: "vet-lviv-care",
          name: "Lviv Veterinary Care",
          phone: "+380322445566"
        },
        notes: "Kidney function stable. Continue monitoring."
      }
    },
    status: "active",
    createdAt: "2025-03-01T09:00:00Z",
    updatedAt: "2025-09-10T10:15:00Z"
  },
  {
    policyId: "POL-2025-456789",
    ownerId: "c3d4e5f6-7g8h-9i0j-1k2l-3m4n5o6p7q8r",
    pet: {
      id: "0g7g3e4d-9h6c-7710-2g9d-2i2g4d6d4h55",
      name: "Rocky",
      species: "dog",
      breed: "German Shepherd",
      sex: "male",
      dateOfBirth: "2019-08-12",
      ageMonths: 74,
      color: "black_tan",
      microchip: {
        number: "981000456789012",
        issuer: "ISO11784/11785",
        dateImplanted: "2019-10-01"
      },
      identifiers: {
        licenseTag: "OD-2025-33445",
        passportNumber: "UA-PET-000445566"
      },
      photoUrl: "https://images.unsplash.com/photo-1568572933382-74d440642117",
      weight: { currentKg: 38.2 },
      spayedNeutered: true,
      lifestyle: {
        indoor: false,
        outdoor: true,
        activityLevel: "high",
        diet: "raw_diet"
      }
    },
    owner: {
      id: "c3d4e5f6-7g8h-9i0j-1k2l-3m4n5o6p7q8r",
      fullName: "Iryna Shevchenko",
      phone: "+380674445566",
      email: "iryna.s@example.com",
      address: {
        country: "Ukraine",
        city: "Odesa",
        street: "Derybasivska 30",
        postalCode: "65000"
      }
    },
    policy: {
      policyId: "POL-2025-456789",
      provider: "PurrSure Insurance",
      status: "active",
      startDate: "2025-01-15",
      endDate: "2026-01-15",
      plan: "Standard",
      coverage: {
        annualLimitUAH: 100000,
        deductibleUAH: 2000,
        copayPercent: 20,
        covered: ["accidents", "illness", "diagnostics", "hospitalization", "surgery"],
        exclusions: ["pre_existing_conditions", "cosmetic_procedures", "breeding"]
      }
    },
    medical: {
      allergies: ["grain"],
      conditions: [{
        code: "ICD-11:FA71",
        name: "Hip dysplasia",
        diagnosedAt: "2023-05-20",
        status: "managed"
      }],
      vaccinations: [
        {
          type: "DHPP",
          date: "2024-12-15",
          validUntil: "2025-12-15",
          vetClinicId: "vet-odesa-clinic"
        },
        {
          type: "Rabies",
          date: "2024-08-12",
          validUntil: "2027-08-12",
          vetClinicId: "vet-odesa-clinic"
        }
      ],
      medications: [{
        name: "Carprofen",
        dosage: "75 mg",
        frequency: "2x/day",
        since: "2023-06-01"
      }],
      lastCheckup: {
        date: "2025-07-20",
        clinic: {
          id: "vet-odesa-clinic",
          name: "Odesa Veterinary Clinic",
          phone: "+380482556677"
        },
        notes: "Hip condition stable with medication. Continue current treatment."
      }
    },
    status: "active",
    createdAt: "2025-01-15T09:00:00Z",
    updatedAt: "2025-07-20T14:00:00Z"
  },
  {
    policyId: "POL-2025-567890",
    ownerId: "d4e5f6g7-8h9i-0j1k-2l3m-4n5o6p7q8r9s",
    pet: {
      id: "1h8h4f5e-0i7d-8821-3h0e-3j3h5e7e5i66",
      name: "Whiskers",
      species: "cat",
      breed: "Maine Coon",
      sex: "male",
      dateOfBirth: "2020-11-25",
      ageMonths: 58,
      color: "brown_tabby",
      microchip: {
        number: "981000567890123",
        issuer: "ISO11784/11785",
        dateImplanted: "2021-01-10"
      },
      identifiers: {
        licenseTag: "KH-2025-44556",
        passportNumber: "UA-PET-000556677"
      },
      photoUrl: "https://images.unsplash.com/photo-1491485880348-85d48a9e5312",
      weight: { currentKg: 7.2 },
      spayedNeutered: true,
      lifestyle: {
        indoor: true,
        outdoor: true,
        activityLevel: "moderate",
        diet: "wet_dry_mix"
      }
    },
    owner: {
      id: "d4e5f6g7-8h9i-0j1k-2l3m-4n5o6p7q8r9s",
      fullName: "Serhiy Bondarenko",
      phone: "+380675556677",
      email: "serhiy.b@example.com",
      address: {
        country: "Ukraine",
        city: "Kharkiv",
        street: "Sumska 40",
        postalCode: "61000"
      }
    },
    policy: {
      policyId: "POL-2025-567890",
      provider: "PurrSure Insurance",
      status: "active",
      startDate: "2025-04-01",
      endDate: "2026-04-01",
      plan: "Premium",
      coverage: {
        annualLimitUAH: 150000,
        deductibleUAH: 1500,
        copayPercent: 10,
        covered: ["accidents", "illness", "diagnostics", "hospitalization", "surgery", "prescription_meds", "dental"],
        exclusions: ["pre_existing_conditions", "cosmetic_procedures"]
      }
    },
    medical: {
      allergies: [],
      conditions: [],
      vaccinations: [
        {
          type: "RCP",
          date: "2025-04-25",
          validUntil: "2026-04-25",
          vetClinicId: "vet-kharkiv-center"
        },
        {
          type: "Rabies",
          date: "2024-11-25",
          validUntil: "2027-11-25",
          vetClinicId: "vet-kharkiv-center"
        }
      ],
      medications: [],
      lastCheckup: {
        date: "2025-09-01",
        clinic: {
          id: "vet-kharkiv-center",
          name: "Kharkiv Veterinary Center",
          phone: "+380572667788"
        },
        notes: "Excellent health. Large, healthy male Maine Coon."
      }
    },
    status: "active",
    createdAt: "2025-04-01T09:00:00Z",
    updatedAt: "2025-09-01T11:30:00Z"
  },
  {
    policyId: "POL-2025-678901",
    ownerId: "e5f6g7h8-9i0j-1k2l-3m4n-5o6p7q8r9s0t",
    pet: {
      id: "2i9i5g6f-1j8e-9932-4i1f-4k4i6f8f6j77",
      name: "Bella",
      species: "dog",
      breed: "Labrador Retriever",
      sex: "female",
      dateOfBirth: "2021-02-14",
      ageMonths: 56,
      color: "chocolate",
      microchip: {
        number: "981000678901234",
        issuer: "ISO11784/11785",
        dateImplanted: "2021-04-01"
      },
      identifiers: {
        licenseTag: "DN-2025-55667",
        passportNumber: "UA-PET-000667788"
      },
      photoUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb",
      weight: { currentKg: 28.5 },
      spayedNeutered: true,
      lifestyle: {
        indoor: true,
        outdoor: true,
        activityLevel: "high",
        diet: "dry_food"
      }
    },
    owner: {
      id: "e5f6g7h8-9i0j-1k2l-3m4n-5o6p7q8r9s0t",
      fullName: "Tetiana Moroz",
      phone: "+380676667788",
      email: "tetiana.m@example.com",
      address: {
        country: "Ukraine",
        city: "Dnipro",
        street: "Naberezhna 50",
        postalCode: "49000"
      }
    },
    policy: {
      policyId: "POL-2025-678901",
      provider: "PurrSure Insurance",
      status: "active",
      startDate: "2025-05-10",
      endDate: "2026-05-10",
      plan: "Standard",
      coverage: {
        annualLimitUAH: 100000,
        deductibleUAH: 2000,
        copayPercent: 20,
        covered: ["accidents", "illness", "diagnostics", "hospitalization", "surgery"],
        exclusions: ["pre_existing_conditions", "cosmetic_procedures", "breeding"]
      }
    },
    medical: {
      allergies: [],
      conditions: [],
      vaccinations: [
        {
          type: "DHPP",
          date: "2025-05-14",
          validUntil: "2026-05-14",
          vetClinicId: "vet-dnipro-pets"
        },
        {
          type: "Rabies",
          date: "2024-02-14",
          validUntil: "2027-02-14",
          vetClinicId: "vet-dnipro-pets"
        }
      ],
      medications: [],
      lastCheckup: {
        date: "2025-08-20",
        clinic: {
          id: "vet-dnipro-pets",
          name: "Dnipro Pets Clinic",
          phone: "+380562778899"
        },
        notes: "Healthy, energetic dog. Weight good for breed."
      }
    },
    status: "active",
    createdAt: "2025-05-10T09:00:00Z",
    updatedAt: "2025-08-20T10:45:00Z"
  },
  {
    policyId: "POL-2025-789012",
    ownerId: "f6g7h8i9-0j1k-2l3m-4n5o-6p7q8r9s0t1u",
    pet: {
      id: "3j0j6h7g-2k9f-0043-5j2g-5l5j7g9g7k88",
      name: "Shadow",
      species: "cat",
      breed: "Siamese",
      sex: "male",
      dateOfBirth: "2023-01-08",
      ageMonths: 33,
      color: "seal_point",
      microchip: {
        number: "981000789012345",
        issuer: "ISO11784/11785",
        dateImplanted: "2023-03-01"
      },
      identifiers: {
        licenseTag: "ZP-2025-66778",
        passportNumber: "UA-PET-000778899"
      },
      photoUrl: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8",
      weight: { currentKg: 4.1 },
      spayedNeutered: true,
      lifestyle: {
        indoor: true,
        outdoor: false,
        activityLevel: "high",
        diet: "dry_food"
      }
    },
    owner: {
      id: "f6g7h8i9-0j1k-2l3m-4n5o-6p7q8r9s0t1u",
      fullName: "Viktor Tkachenko",
      phone: "+380677778899",
      email: "viktor.t@example.com",
      address: {
        country: "Ukraine",
        city: "Zaporizhzhia",
        street: "Sobornyi 60",
        postalCode: "69000"
      }
    },
    policy: {
      policyId: "POL-2025-789012",
      provider: "PurrSure Insurance",
      status: "active",
      startDate: "2025-06-01",
      endDate: "2026-06-01",
      plan: "Basic",
      coverage: {
        annualLimitUAH: 50000,
        deductibleUAH: 3000,
        copayPercent: 30,
        covered: ["accidents", "illness", "diagnostics"],
        exclusions: ["pre_existing_conditions", "cosmetic_procedures", "dental", "prescription_meds"]
      }
    },
    medical: {
      allergies: [],
      conditions: [],
      vaccinations: [
        {
          type: "RCP",
          date: "2025-06-08",
          validUntil: "2026-06-08",
          vetClinicId: "vet-zp-clinic"
        }
      ],
      medications: [],
      lastCheckup: {
        date: "2025-09-15",
        clinic: {
          id: "vet-zp-clinic",
          name: "Zaporizhzhia Vet Clinic",
          phone: "+380612889900"
        },
        notes: "Young, healthy Siamese. Very vocal and active."
      }
    },
    status: "active",
    createdAt: "2025-06-01T09:00:00Z",
    updatedAt: "2025-09-15T12:00:00Z"
  },
  {
    policyId: "POL-2025-890123",
    ownerId: "g7h8i9j0-1k2l-3m4n-5o6p-7q8r9s0t1u2v",
    pet: {
      id: "4k1k7i8h-3l0g-1154-6k3h-6m6k8h0h8l99",
      name: "Charlie",
      species: "dog",
      breed: "Beagle",
      sex: "male",
      dateOfBirth: "2022-05-22",
      ageMonths: 41,
      color: "tricolor",
      microchip: {
        number: "981000890123456",
        issuer: "ISO11784/11785",
        dateImplanted: "2022-07-10"
      },
      identifiers: {
        licenseTag: "PL-2025-77889",
        passportNumber: "UA-PET-000889900"
      },
      photoUrl: "https://images.unsplash.com/photo-1505628346881-b72b27e84530",
      weight: { currentKg: 12.8 },
      spayedNeutered: true,
      lifestyle: {
        indoor: true,
        outdoor: true,
        activityLevel: "moderate",
        diet: "dry_food"
      }
    },
    owner: {
      id: "g7h8i9j0-1k2l-3m4n-5o6p-7q8r9s0t1u2v",
      fullName: "Natalia Koval",
      phone: "+380678889900",
      email: "natalia.k@example.com",
      address: {
        country: "Ukraine",
        city: "Poltava",
        street: "Sobornosti 70",
        postalCode: "36000"
      }
    },
    policy: {
      policyId: "POL-2025-890123",
      provider: "PurrSure Insurance",
      status: "active",
      startDate: "2025-07-15",
      endDate: "2026-07-15",
      plan: "Standard",
      coverage: {
        annualLimitUAH: 100000,
        deductibleUAH: 2000,
        copayPercent: 20,
        covered: ["accidents", "illness", "diagnostics", "hospitalization", "surgery"],
        exclusions: ["pre_existing_conditions", "cosmetic_procedures", "breeding"]
      }
    },
    medical: {
      allergies: [],
      conditions: [],
      vaccinations: [
        {
          type: "DHPP",
          date: "2025-07-22",
          validUntil: "2026-07-22",
          vetClinicId: "vet-poltava-care"
        },
        {
          type: "Rabies",
          date: "2025-05-22",
          validUntil: "2028-05-22",
          vetClinicId: "vet-poltava-care"
        }
      ],
      medications: [],
      lastCheckup: {
        date: "2025-09-05",
        clinic: {
          id: "vet-poltava-care",
          name: "Poltava Veterinary Care",
          phone: "+380532990011"
        },
        notes: "Friendly beagle in good health. Watch weight."
      }
    },
    status: "active",
    createdAt: "2025-07-15T09:00:00Z",
    updatedAt: "2025-09-05T11:15:00Z"
  },
  {
    policyId: "POL-2025-901234",
    ownerId: "h8i9j0k1-2l3m-4n5o-6p7q-8r9s0t1u2v3w",
    pet: {
      id: "5l2l8j9i-4m1h-2265-7l4i-7n7l9i1i9m00",
      name: "Fluffy",
      species: "cat",
      breed: "Ragdoll",
      sex: "female",
      dateOfBirth: "2021-09-30",
      ageMonths: 48,
      color: "blue_point",
      microchip: {
        number: "981000901234567",
        issuer: "ISO11784/11785",
        dateImplanted: "2021-11-15"
      },
      identifiers: {
        licenseTag: "CH-2025-88990",
        passportNumber: "UA-PET-000990011"
      },
      photoUrl: "https://images.unsplash.com/photo-1529778873920-4da4926a72c2",
      weight: { currentKg: 5.5 },
      spayedNeutered: true,
      lifestyle: {
        indoor: true,
        outdoor: false,
        activityLevel: "low",
        diet: "wet_food"
      }
    },
    owner: {
      id: "h8i9j0k1-2l3m-4n5o-6p7q-8r9s0t1u2v3w",
      fullName: "Yuriy Savchenko",
      phone: "+380679990011",
      email: "yuriy.s@example.com",
      address: {
        country: "Ukraine",
        city: "Chernivtsi",
        street: "Holovna 80",
        postalCode: "58000"
      }
    },
    policy: {
      policyId: "POL-2025-901234",
      provider: "PurrSure Insurance",
      status: "active",
      startDate: "2025-08-01",
      endDate: "2026-08-01",
      plan: "Premium",
      coverage: {
        annualLimitUAH: 150000,
        deductibleUAH: 1500,
        copayPercent: 10,
        covered: ["accidents", "illness", "diagnostics", "hospitalization", "surgery", "prescription_meds", "dental"],
        exclusions: ["pre_existing_conditions", "cosmetic_procedures"]
      }
    },
    medical: {
      allergies: [],
      conditions: [],
      vaccinations: [
        {
          type: "RCP",
          date: "2025-08-30",
          validUntil: "2026-08-30",
          vetClinicId: "vet-chernivtsi-center"
        },
        {
          type: "Rabies",
          date: "2024-09-30",
          validUntil: "2027-09-30",
          vetClinicId: "vet-chernivtsi-center"
        }
      ],
      medications: [],
      lastCheckup: {
        date: "2025-09-25",
        clinic: {
          id: "vet-chernivtsi-center",
          name: "Chernivtsi Veterinary Center",
          phone: "+380372001122"
        },
        notes: "Beautiful, calm Ragdoll. Perfect health."
      }
    },
    status: "active",
    createdAt: "2025-08-01T09:00:00Z",
    updatedAt: "2025-09-25T13:30:00Z"
  },
  {
    policyId: "POL-2025-012345",
    ownerId: "i9j0k1l2-3m4n-5o6p-7q8r-9s0t1u2v3w4x",
    pet: {
      id: "6m3m9k0j-5n2i-3376-8m5j-8o8m0j2j0n11",
      name: "Rex",
      species: "dog",
      breed: "Rottweiler",
      sex: "male",
      dateOfBirth: "2020-12-05",
      ageMonths: 58,
      color: "black_tan",
      microchip: {
        number: "981000012345678",
        issuer: "ISO11784/11785",
        dateImplanted: "2021-02-01"
      },
      identifiers: {
        licenseTag: "IV-2025-99001",
        passportNumber: "UA-PET-001100112"
      },
      photoUrl: "https://images.unsplash.com/photo-1567752881298-894bb81f9379",
      weight: { currentKg: 52.3 },
      spayedNeutered: true,
      lifestyle: {
        indoor: false,
        outdoor: true,
        activityLevel: "moderate",
        diet: "raw_diet"
      }
    },
    owner: {
      id: "i9j0k1l2-3m4n-5o6p-7q8r-9s0t1u2v3w4x",
      fullName: "Maksym Hryhorenko",
      phone: "+380670001122",
      email: "maksym.h@example.com",
      address: {
        country: "Ukraine",
        city: "Ivano-Frankivsk",
        street: "Nezalezhnosti 90",
        postalCode: "76000"
      }
    },
    policy: {
      policyId: "POL-2025-012345",
      provider: "PurrSure Insurance",
      status: "active",
      startDate: "2025-09-01",
      endDate: "2026-09-01",
      plan: "Standard",
      coverage: {
        annualLimitUAH: 100000,
        deductibleUAH: 2000,
        copayPercent: 20,
        covered: ["accidents", "illness", "diagnostics", "hospitalization", "surgery"],
        exclusions: ["pre_existing_conditions", "cosmetic_procedures", "breeding"]
      }
    },
    medical: {
      allergies: [],
      conditions: [{
        code: "ICD-11:FA72",
        name: "Elbow dysplasia",
        diagnosedAt: "2024-03-15",
        status: "managed"
      }],
      vaccinations: [
        {
          type: "DHPP",
          date: "2025-09-05",
          validUntil: "2026-09-05",
          vetClinicId: "vet-if-clinic"
        },
        {
          type: "Rabies",
          date: "2024-12-05",
          validUntil: "2027-12-05",
          vetClinicId: "vet-if-clinic"
        }
      ],
      medications: [{
        name: "Rimadyl",
        dosage: "100 mg",
        frequency: "1x/day",
        since: "2024-04-01"
      }],
      lastCheckup: {
        date: "2025-09-28",
        clinic: {
          id: "vet-if-clinic",
          name: "Ivano-Frankivsk Vet Clinic",
          phone: "+380342112233"
        },
        notes: "Large, protective dog. Elbow condition managed with medication."
      }
    },
    status: "active",
    createdAt: "2025-09-01T09:00:00Z",
    updatedAt: "2025-09-28T14:20:00Z"
  }
];

export async function seed() {
  console.log(`Seeding ${TABLE_NAME} table with ${policies.length} policies...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const policy of policies) {
    try {
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: policy
      });
      
      await docClient.send(command);
      console.log(`✓ Seeded policy: ${policy.policyId} - ${policy.pet.name} (${policy.pet.species})`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to seed policy ${policy.policyId}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n✓ Seeding complete:`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Total: ${policies.length}`);
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

