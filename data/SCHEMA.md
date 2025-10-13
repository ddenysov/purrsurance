# Policies Table Schema

Complete schema reference for the Policies DynamoDB table.

## Table Structure

### Primary Key
- **policyId** (String, HASH) - Unique policy identifier (e.g., "POL-2025-123456")

### Global Secondary Indexes

#### OwnerIdIndex
- **ownerId** (String, HASH) - Owner identifier
- **Projection**: ALL
- **Use case**: Query all policies for a specific owner

#### StatusIndex
- **status** (String, HASH) - Policy status
- **Projection**: ALL
- **Use case**: Query all policies by status (active, expired, cancelled)

## Attributes Schema

### Root Level

```typescript
{
  policyId: string;        // Primary key
  ownerId: string;         // GSI key
  status: string;          // GSI key: "active" | "expired" | "cancelled"
  pet: Pet;               // Pet information
  owner: Owner;           // Owner information
  policy: PolicyDetails;  // Policy coverage details
  medical: MedicalHistory;// Medical records
  createdAt: string;      // ISO 8601 timestamp
  updatedAt: string;      // ISO 8601 timestamp
}
```

### Pet Object

```typescript
{
  id: string;                    // Unique pet identifier
  name: string;                  // Pet name
  species: "cat" | "dog";        // Species
  breed: string;                 // Breed name
  sex: "male" | "female";        // Sex
  dateOfBirth: string;           // YYYY-MM-DD format
  ageMonths: number;             // Age in months
  color: string;                 // Color/marking description
  microchip: {
    number: string;              // Microchip number
    issuer: string;              // Issuer standard (e.g., "ISO11784/11785")
    dateImplanted: string;       // YYYY-MM-DD format
  };
  identifiers: {
    licenseTag?: string;         // License tag number
    passportNumber?: string;     // Pet passport number
  };
  photoUrl?: string;             // Photo URL
  weight: {
    currentKg: number;           // Current weight in kg
  };
  spayedNeutered: boolean;       // Spay/neuter status
  lifestyle: {
    indoor: boolean;             // Indoor pet
    outdoor: boolean;            // Outdoor pet
    activityLevel: "low" | "moderate" | "high";
    diet: "wet_food" | "dry_food" | "wet_dry_mix" | "raw_diet";
  };
}
```

### Owner Object

```typescript
{
  id: string;                    // Unique owner identifier
  fullName: string;              // Full name
  phone: string;                 // Phone with country code
  email: string;                 // Email address
  address: {
    country: string;             // Country
    city: string;                // City
    street: string;              // Street address
    postalCode: string;          // Postal code
  };
}
```

### PolicyDetails Object

```typescript
{
  policyId: string;              // Same as root policyId
  provider: string;              // Insurance provider name
  status: "active" | "expired" | "cancelled";
  startDate: string;             // YYYY-MM-DD format
  endDate: string;               // YYYY-MM-DD format
  plan: "Basic" | "Standard" | "Premium";
  coverage: {
    annualLimitUAH: number;      // Annual coverage limit
    deductibleUAH: number;       // Deductible amount
    copayPercent: number;        // Copay percentage
    covered: string[];           // List of covered services
    exclusions: string[];        // List of exclusions
  };
}
```

### MedicalHistory Object

```typescript
{
  allergies: string[];           // List of allergies
  conditions: Condition[];       // Medical conditions
  vaccinations: Vaccination[];   // Vaccination records
  medications: Medication[];     // Current medications
  lastCheckup: LastCheckup;      // Last veterinary checkup
}
```

#### Condition

```typescript
{
  code: string;                  // ICD-11 code
  name: string;                  // Condition name
  diagnosedAt: string;           // YYYY-MM-DD format
  status: "active" | "managed" | "resolved" | "monitored";
}
```

#### Vaccination

```typescript
{
  type: string;                  // Vaccine type (e.g., "RCP", "DHPP", "Rabies")
  date: string;                  // YYYY-MM-DD format
  validUntil: string;            // YYYY-MM-DD format
  vetClinicId: string;           // Clinic identifier
}
```

#### Medication

```typescript
{
  name: string;                  // Medication name
  dosage: string;                // Dosage description
  frequency: string;             // Frequency (e.g., "2x/day")
  since: string;                 // YYYY-MM-DD format
}
```

#### LastCheckup

```typescript
{
  date: string;                  // YYYY-MM-DD format
  clinic: {
    id: string;                  // Clinic identifier
    name: string;                // Clinic name
    phone: string;               // Clinic phone
  };
  notes: string;                 // Veterinarian notes
}
```

## Common Query Patterns

### Get Policy by ID

```javascript
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const command = new GetCommand({
  TableName: "Policies",
  Key: { policyId: "POL-2025-123456" }
});

const result = await docClient.send(command);
```

### Get All Policies for Owner

```javascript
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const command = new QueryCommand({
  TableName: "Policies",
  IndexName: "OwnerIdIndex",
  KeyConditionExpression: "ownerId = :ownerId",
  ExpressionAttributeValues: {
    ":ownerId": "c6c1c5b9-3c1c-4d2e-a4f1-8c1f2d9a0a55"
  }
});

const result = await docClient.send(command);
```

### Get All Active Policies

```javascript
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const command = new QueryCommand({
  TableName: "Policies",
  IndexName: "StatusIndex",
  KeyConditionExpression: "#status = :status",
  ExpressionAttributeNames: {
    "#status": "status"
  },
  ExpressionAttributeValues: {
    ":status": "active"
  }
});

const result = await docClient.send(command);
```

### Update Policy

```javascript
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const command = new UpdateCommand({
  TableName: "Policies",
  Key: { policyId: "POL-2025-123456" },
  UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
  ExpressionAttributeNames: {
    "#status": "status"
  },
  ExpressionAttributeValues: {
    ":status": "expired",
    ":updatedAt": new Date().toISOString()
  }
});

const result = await docClient.send(command);
```

## Coverage Types

### Covered Services
- `accidents` - Accident-related injuries
- `illness` - Illness treatment
- `diagnostics` - Diagnostic tests
- `hospitalization` - Hospital stays
- `surgery` - Surgical procedures
- `prescription_meds` - Prescription medications
- `dental` - Dental care (Premium only)

### Common Exclusions
- `pre_existing_conditions` - Pre-existing conditions
- `cosmetic_procedures` - Cosmetic procedures
- `breeding` - Breeding-related care

## Plan Types

| Plan | Annual Limit | Deductible | Copay | Covered Services |
|------|-------------|------------|-------|------------------|
| Basic | 50,000 UAH | 3,000 UAH | 30% | Accidents, Illness, Diagnostics |
| Standard | 100,000 UAH | 2,000 UAH | 20% | + Hospitalization, Surgery |
| Premium | 150,000 UAH | 1,500 UAH | 10% | + Prescription Meds, Dental |

## Vaccination Types

### Cats
- **RCP** - Rhinotracheitis, Calicivirus, Panleukopenia
- **Rabies** - Rabies vaccine

### Dogs
- **DHPP** - Distemper, Hepatitis, Parvovirus, Parainfluenza
- **Rabies** - Rabies vaccine

## Sample Policy IDs

All policy IDs from seed data:
- POL-2025-123456 (Mittens, Cat)
- POL-2025-234567 (Max, Dog)
- POL-2025-345678 (Luna, Cat)
- POL-2025-456789 (Rocky, Dog)
- POL-2025-567890 (Whiskers, Cat)
- POL-2025-678901 (Bella, Dog)
- POL-2025-789012 (Shadow, Cat)
- POL-2025-890123 (Charlie, Dog)
- POL-2025-901234 (Fluffy, Cat)
- POL-2025-012345 (Rex, Dog)

