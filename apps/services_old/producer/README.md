# Event Producer Lambda

AWS Lambda function that publishes events to SNS topic for downstream processing.

## Overview

This function acts as an event producer in the event-driven architecture:
- Receives HTTP POST requests via API Gateway
- Validates and parses the request body
- Publishes events to SNS topic with appropriate metadata
- Returns success/error response to the caller

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EVENTS_TOPIC_ARN` | ARN of the SNS topic to publish to | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## Request Format

### Endpoint
`POST /publish`

### Request Body
```json
{
  "eventType": "PolicyUpdate",
  "subject": "Optional subject line",
  "data": {
    "policyId": "POLICY-123",
    "action": "update",
    "timestamp": "2025-10-06T12:00:00Z",
    "changes": {
      "coverage": 150000
    }
  }
}
```

### Fields
- `eventType` (optional): Type of event, defaults to "PolicyUpdate"
- `subject` (optional): SNS message subject
- `data` (required): Event payload

## Response Format

### Success (200)
```json
{
  "success": true,
  "message": "Event published successfully",
  "messageId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "eventType": "PolicyUpdate",
  "timestamp": "2025-10-06T12:00:00Z"
}
```

### Error (400/500)
```json
{
  "error": "Error type",
  "message": "Error description",
  "details": "Additional details (dev only)"
}
```

## Message Attributes

The function adds the following SNS message attributes:
- `eventType`: Event type from request or default
- `timestamp`: ISO 8601 timestamp when message was published
- `requestId`: Lambda request ID for tracking

## Error Handling

The function handles:
- Empty request body (400)
- Invalid JSON format (400)
- Missing topic ARN configuration (500)
- SNS publish errors (500)

## Local Testing

Create a test event file:

```json
{
  "body": "{\"eventType\":\"PolicyUpdate\",\"data\":{\"policyId\":\"TEST-123\"}}"
}
```

Run locally:
```bash
sam local invoke EventProducerFunction -e events/test.json
```

## Deployment

This function is deployed via SAM template as part of the services stack:

```bash
cd /Users/dmytro.denysov/Work/Sites/purrsurance/apps/services
sam build
sam deploy
```

## Architecture

```
API Gateway → Lambda (Producer) → SNS Topic → Lambda (Consumer)
                                              → DynamoDB
```

## Permissions

The function requires:
- SNS publish permissions for the configured topic
- CloudWatch Logs write permissions (automatic)

## Monitoring

Key metrics to monitor:
- Invocation count
- Error rate
- Duration
- SNS publish success/failure

CloudWatch logs include:
- Request ID for tracing
- Event type and size
- SNS message ID on success
- Detailed error information

