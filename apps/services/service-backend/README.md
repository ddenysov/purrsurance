# Service Backend

REST API backend service for retrieving veterinary appointments from DynamoDB.

## Overview

This Lambda function provides a simple REST API endpoint to fetch all veterinary appointments from the `VetAppointments` DynamoDB table.

## Endpoints

### GET /vet-appointments

Returns all veterinary appointments in JSON format.

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "appointmentId": "appt-001",
      "policyId": "POL-12345",
      "petId": "pet-001",
      "appointmentDate": "2024-11-15T10:00:00Z",
      "status": "scheduled",
      ...
    }
  ],
  "timestamp": "2024-10-14T12:00:00.000Z"
}
```

## CORS Configuration

CORS is enabled with wildcard (`*`) settings for:
- Origins
- Headers
- Methods

## Setup

1. Install dependencies:
```bash
make install
```

2. Build the function:
```bash
make build
```

3. Deploy to AWS:
```bash
make deploy
```

## Environment Variables

- `ENVIRONMENT` - Environment name (default: prod)
- `VET_APPOINTMENTS_TABLE_NAME` - DynamoDB table name (default: VetAppointments)
- `LOG_LEVEL` - Logging level (default: info)
- `NODE_ENV` - Node environment (production/development)

## Local Development

To test locally with SAM:

```bash
sam local start-api
```

Then access:
```
http://localhost:3000/vet-appointments
```

## Deployment

The service is deployed using AWS SAM (Serverless Application Model). Configuration is in `samconfig.toml`.

```bash
make deploy
```

## Logs

To view CloudWatch logs:

```bash
make logs
```

## Architecture

- **Runtime:** Node.js 20.x
- **Memory:** 256 MB
- **Timeout:** 30 seconds
- **API Gateway:** REST API with CORS enabled
- **Database:** DynamoDB (VetAppointments table)

