# Find Vet Clinic Tool

Lambda function that finds vet clinics for pets and publishes events to the Event Publisher service.

## Overview

This tool is designed to be used with AWS Bedrock Agents. It accepts location, specialty, and urgency parameters and returns a list of nearby vet clinics.

## Parameters

- `location` (string, optional): Location to search for clinics (city, zip code, etc.)
- `specialty` (string, optional): Specialty to filter by (e.g., "Emergency", "Surgery", "General Practice")
- `urgency` (string, optional): Urgency level ("normal" or "urgent")

## Response Format

The function returns a JSON response with:
- `searchCriteria`: The search parameters used
- `clinics`: Array of vet clinic objects with details (name, address, phone, rating, etc.)
- `totalFound`: Number of clinics found
- `timestamp`: ISO timestamp of the search
- `message`: Human-readable message about the search results

## Local Development

### Prerequisites

- AWS SAM CLI
- Node.js 20.x
- pnpm or npm

### Setup

1. Copy `env.json.example` to `env.json`:
```bash
cp env.json.example env.json
```

2. Install dependencies:
```bash
pnpm install
```

### Running Locally

Start the Lambda function locally:
```bash
pnpm start
# or
./start-local.sh
```

Test the function with a sample event:
```bash
pnpm test:local
# or
./test-local.sh
```

### Building and Deployment

Build the function:
```bash
make build
```

Deploy to AWS:
```bash
make deploy
```

## Event Publishing

This function publishes events to the Event Publisher service when a search is performed. The events are sent via HTTP POST to the configured `EVENT_PUBLISHER_URL`.

## Integration with Bedrock Agent

This function is designed to work with AWS Bedrock Agents using the Function Response format. Configure your Bedrock Agent to use this Lambda function as an action.

### Function Schema

```json
{
  "name": "findVetClinic",
  "description": "Find nearby vet clinics based on location, specialty, and urgency",
  "parameters": {
    "location": {
      "description": "Location to search for clinics",
      "type": "string",
      "required": false
    },
    "specialty": {
      "description": "Type of specialty needed",
      "type": "string",
      "required": false
    },
    "urgency": {
      "description": "Urgency level (normal or urgent)",
      "type": "string",
      "required": false
    }
  }
}
```

