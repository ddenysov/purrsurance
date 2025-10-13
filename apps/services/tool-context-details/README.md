# Get Context Details Function

Lambda function for AWS Bedrock Agent that retrieves detailed context information for pet insurance.

## Features

- Retrieves complete context details including pet, owner, medical records, and claims
- Publishes events to Event Publisher service via HTTP for real-time event tracking
- Publishes `context_updated` event to SNS topic for downstream processing (legacy)
- Designed for Bedrock Agent function response format (no OpenAPI schema required)

## Architecture

```
Bedrock Agent → Lambda Function → Returns Response
                      ↓
        ┌─────────────┴─────────────┐
        ↓                           ↓
  Event Publisher API          SNS Topic
        ↓                           ↓
    DynamoDB                  Event Saver
```

## Event Publishing

The function automatically publishes a `context_updated` event to the SNS topic when:
- Context details are successfully retrieved
- No errors occurred during processing

### Event Structure

```json
{
  "eventType": "context_updated",
  "timestamp": "2025-10-06T12:34:56.789Z",
  "data": {
    "pet": { ... },
    "owner": { ... },
    "context": { ... },
    "medical": { ... },
    "claims": [ ... ],
    "vetContacts": [ ... ],
    "audit": { ... }
  }
}
```

### Message Attributes

- `eventType`: "context_updated"
- `timestamp`: ISO 8601 timestamp
- `source`: "get-context-details"

## Environment Variables

- `EVENTS_TOPIC_ARN`: ARN of the SNS topic for publishing events

## Dependencies

- `@aws-sdk/client-sns`: AWS SDK for SNS operations
- `axios`: HTTP client (for future API calls)

## Installation

```bash
npm install
```

## Local Testing

```bash
./test-local.sh
```

Or using sam directly:

```bash
sam local invoke GetContextDetailsFunction \
  --event events/bedrock-agent-event.json \
  --template ../template.yaml \
  --env-vars env.json
```

## Deployment

This function is deployed as part of the SAM template:

```bash
cd ../
sam build
sam deploy
```

## Response Format

Returns Bedrock Agent function response format:

```json
{
  "messageVersion": "1.0",
  "response": {
    "actionGroup": "ContextActions",
    "function": "getContextDetails",
    "functionResponse": {
      "responseBody": {
        "TEXT": {
          "body": "{...context details...}"
        }
      }
    }
  }
}
```

## Error Handling

- If SNS publish fails, the error is logged but doesn't affect the main response
- Errors in context retrieval return appropriate error messages to Bedrock Agent

## Notes

- Currently returns hardcoded mock data
- In production, this should connect to actual database/API
- The function uses default contextId if not provided by the agent

