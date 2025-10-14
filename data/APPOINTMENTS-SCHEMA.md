# VetAppointments Table Schema

Complete schema reference for the VetAppointments DynamoDB table.

## Table Structure

### Primary Key
- **appointmentId** (String, HASH) - Unique appointment identifier (e.g., "APPT-2025-123456")

### Global Secondary Indexes

#### PolicyIdIndex
- **policyId** (String, HASH) - Policy identifier
- **appointmentDate** (String, RANGE) - Appointment date/time
- **Projection**: ALL
- **Use case**: Query all appointments for a specific policy

#### PetIdIndex
- **petId** (String, HASH) - Pet identifier
- **appointmentDate** (String, RANGE) - Appointment date/time
- **Projection**: ALL
- **Use case**: Query all appointments for a specific pet

#### StatusIndex
- **status** (String, HASH) - Appointment status
- **appointmentDate** (String, RANGE) - Appointment date/time
- **Projection**: ALL
- **Use case**: Query appointments by status (scheduled, completed, cancelled)

## Attributes Schema

### Root Level

```typescript
{
  appointmentId: string;          // Primary key
  policyId: string;               // GSI key - reference to Policies table
  petId: string;                  // GSI key - pet identifier
  appointmentDate: string;        // GSI sort key - ISO 8601 timestamp
  status: string;                 // GSI key: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show"
  pet: PetInfo;                   // Pet information snapshot
  owner: OwnerInfo;               // Owner information snapshot
  clinic: ClinicInfo;             // Veterinary clinic details
  appointment: AppointmentDetails;// Appointment specifics
  medicalContext?: MedicalContext;// Medical context from Vet Doctor (if available)
  sessionId: string;              // Session identifier for tracing
  createdAt: string;              // ISO 8601 timestamp
  updatedAt: string;              // ISO 8601 timestamp
}
```

### PetInfo Object

```typescript
{
  id: string;                     // Pet identifier from policy
  name: string;                   // Pet name
  species: "cat" | "dog";         // Species
  breed: string;                  // Breed name
  sex: "male" | "female";         // Sex
  dateOfBirth: string;            // YYYY-MM-DD format
  ageMonths: number;              // Age in months
  weight?: {
    currentKg: number;            // Current weight in kg
  };
  microchip?: {
    number: string;               // Microchip number
  };
  spayedNeutered?: boolean;       // Spay/neuter status
  allergies?: string[];           // Known allergies
  conditions?: string[];          // Active medical conditions
  vaccinations?: Vaccination[];   // Vaccination records
}
```

### OwnerInfo Object

```typescript
{
  id: string;                     // Owner identifier from policy
  fullName: string;               // Full name
  phone: string;                  // Phone with country code
  email: string;                  // Email address
  address: {
    country: string;              // Country
    city: string;                 // City
    street: string;               // Street address
    postalCode: string;           // Postal code
  };
}
```

### ClinicInfo Object

```typescript
{
  id: string;                     // Clinic identifier
  name: string;                   // Clinic name
  address: {
    street: string;               // Street address
    city: string;                 // City
    postalCode: string;           // Postal code
    country: string;              // Country
  };
  phone: string;                  // Clinic phone number
  email?: string;                 // Clinic email
  specialty?: string;             // Specialty (e.g., "Emergency", "General", "Surgery")
  acceptsInsurance?: boolean;     // Whether clinic accepts pet insurance
}
```

### AppointmentDetails Object

```typescript
{
  type: "routine" | "urgent" | "emergency" | "specialist" | "follow-up";
  reason: string;                 // Reason for visit (e.g., "Annual checkup", "Vomiting")
  appointmentDate: string;        // ISO 8601 timestamp (YYYY-MM-DDTHH:mm:ss.sssZ)
  duration?: number;              // Expected duration in minutes
  notes?: string;                 // Additional notes from booking
  preparationInstructions?: string; // What to bring/prepare
  confirmationNumber?: string;    // Clinic confirmation number
  reminderSent?: boolean;         // Whether reminder was sent
  arrivalTime?: string;           // Recommended arrival time
}
```

### MedicalContext Object (Optional)

```typescript
{
  diagnosis?: string;             // Preliminary diagnosis from Vet Doctor agent
  symptoms?: string[];            // Symptoms reported during consultation
  assessment?: string;            // Medical assessment and reasoning
  urgencyLevel?: "emergency" | "urgent" | "normal" | "routine";
  visitRecommendation?: string;   // Type of vet needed and why
  petCondition?: string;          // Current condition summary
  savedAt?: string;               // When medical context was saved (ISO 8601)
}
```

### Vaccination (in PetInfo)

```typescript
{
  type: string;                   // Vaccine type (e.g., "RCP", "DHPP", "Rabies")
  date: string;                   // YYYY-MM-DD format
  validUntil: string;             // YYYY-MM-DD format
  vetClinicId?: string;           // Clinic identifier
}
```

## Common Query Patterns

### Get Appointment by ID

```javascript
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const command = new GetCommand({
  TableName: "VetAppointments",
  Key: { appointmentId: "APPT-2025-123456" }
});

const result = await docClient.send(command);
```

### Get All Appointments for Policy

```javascript
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const command = new QueryCommand({
  TableName: "VetAppointments",
  IndexName: "PolicyIdIndex",
  KeyConditionExpression: "policyId = :policyId",
  ExpressionAttributeValues: {
    ":policyId": "POL-2025-123456"
  },
  ScanIndexForward: false // Most recent first
});

const result = await docClient.send(command);
```

### Get All Appointments for Pet

```javascript
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const command = new QueryCommand({
  TableName: "VetAppointments",
  IndexName: "PetIdIndex",
  KeyConditionExpression: "petId = :petId",
  ExpressionAttributeValues: {
    ":petId": "PET-123456"
  },
  ScanIndexForward: false // Most recent first
});

const result = await docClient.send(command);
```

### Get Upcoming Appointments by Status

```javascript
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const now = new Date().toISOString();

const command = new QueryCommand({
  TableName: "VetAppointments",
  IndexName: "StatusIndex",
  KeyConditionExpression: "#status = :status AND appointmentDate >= :now",
  ExpressionAttributeNames: {
    "#status": "status"
  },
  ExpressionAttributeValues: {
    ":status": "scheduled",
    ":now": now
  },
  ScanIndexForward: true // Chronological order
});

const result = await docClient.send(command);
```

### Update Appointment Status

```javascript
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const command = new UpdateCommand({
  TableName: "VetAppointments",
  Key: { appointmentId: "APPT-2025-123456" },
  UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
  ExpressionAttributeNames: {
    "#status": "status"
  },
  ExpressionAttributeValues: {
    ":status": "completed",
    ":updatedAt": new Date().toISOString()
  }
});

const result = await docClient.send(command);
```

### Create New Appointment

```javascript
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const appointment = {
  appointmentId: "APPT-2025-123456",
  policyId: "POL-2025-123456",
  petId: "PET-123456",
  appointmentDate: "2025-10-20T14:30:00.000Z",
  status: "scheduled",
  pet: {
    id: "PET-123456",
    name: "Mittens",
    species: "cat",
    breed: "Siamese",
    sex: "female",
    dateOfBirth: "2020-03-15",
    ageMonths: 67
  },
  owner: {
    id: "OWN-123456",
    fullName: "Sarah Johnson",
    phone: "+380501234567",
    email: "sarah@example.com",
    address: {
      country: "Ukraine",
      city: "Kyiv",
      street: "Khreshchatyk St, 22",
      postalCode: "01001"
    }
  },
  clinic: {
    id: "CLINIC-001",
    name: "City Veterinary Clinic",
    address: {
      street: "Main Street 123",
      city: "Kyiv",
      postalCode: "02000",
      country: "Ukraine"
    },
    phone: "+380441234567",
    specialty: "General",
    acceptsInsurance: true
  },
  appointment: {
    type: "routine",
    reason: "Annual checkup and vaccination",
    appointmentDate: "2025-10-20T14:30:00.000Z",
    duration: 30,
    notes: "First annual checkup",
    arrivalTime: "2025-10-20T14:20:00.000Z"
  },
  sessionId: "session-123456",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const command = new PutCommand({
  TableName: "VetAppointments",
  Item: appointment
});

const result = await docClient.send(command);
```

## Appointment Types

- `routine` - Regular checkups, vaccinations, preventive care
- `urgent` - Needs attention soon but not emergency (within 24-48 hours)
- `emergency` - Immediate attention required
- `specialist` - Requires specialist veterinarian
- `follow-up` - Follow-up from previous visit

## Appointment Statuses

- `scheduled` - Appointment is scheduled but not confirmed by clinic
- `confirmed` - Clinic has confirmed the appointment
- `completed` - Appointment was completed
- `cancelled` - Appointment was cancelled
- `no-show` - Patient did not show up for appointment

## Urgency Levels (in MedicalContext)

- `emergency` - Life-threatening, immediate attention required
- `urgent` - Serious condition, needs attention within 24 hours
- `normal` - Standard care, can wait a few days
- `routine` - Regular checkups, preventive care

## Integration with Other Tables

### Policies Table
- `policyId` links to Policies table to retrieve full policy details
- Use to verify coverage before booking
- Check policy status is "active"

### ChatHistory Table
- `sessionId` links to ChatHistory for conversation context
- Retrieve medical context saved by Vet Doctor agent
- Access booking conversation history

## Sample Appointment IDs

Format: `APPT-YYYY-XXXXXX` where:
- `YYYY` is the year
- `XXXXXX` is a sequential or random 6-digit number

Examples:
- APPT-2025-123456
- APPT-2025-234567
- APPT-2025-345678

## Best Practices

1. **Always snapshot pet and owner data** - Store complete information at booking time to preserve history even if policy data changes
2. **Include medical context** - When available from Vet Doctor agent, include diagnosis and symptoms
3. **Track session ID** - Essential for debugging and tracing booking flow
4. **Use ISO 8601 timestamps** - For proper sorting and timezone handling
5. **Update timestamps** - Always update `updatedAt` when modifying records
6. **Validate before booking** - Ensure policy is active and pet is covered
7. **Send reminders** - Use `appointmentDate` to schedule reminder notifications
8. **Handle cancellations** - Update status to "cancelled" rather than deleting records

