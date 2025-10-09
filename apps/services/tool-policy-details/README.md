# Get Policy Details Function

Lambda function for AWS Bedrock Agent that retrieves detailed policy information for pet insurance.

## Features

- Retrieves complete policy details including pet, owner, medical records, and claims
- Publishes events to Event Publisher service via HTTP for real-time event tracking
- Publishes `policy_updated` event to SNS topic for downstream processing (legacy)
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

The function automatically publishes a `policy_updated` event to the SNS topic when:
- Policy details are successfully retrieved
- No errors occurred during processing

### Event Structure

```json
{
  "eventType": "policy_updated",
  "timestamp": "2025-10-06T12:34:56.789Z",
  "data": {
    "pet": { ... },
    "owner": { ... },
    "policy": { ... },
    "medical": { ... },
    "claims": [ ... ],
    "vetContacts": [ ... ],
    "audit": { ... }
  }
}
```

### Message Attributes

- `eventType`: "policy_updated"
- `timestamp`: ISO 8601 timestamp
- `source`: "get-policy-details"

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
sam local invoke GetPolicyDetailsFunction \
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
    "actionGroup": "PolicyActions",
    "function": "getPolicyDetails",
    "functionResponse": {
      "responseBody": {
        "TEXT": {
          "body": "{...policy details...}"
        }
      }
    }
  }
}
```

## Error Handling

- If SNS publish fails, the error is logged but doesn't affect the main response
- Errors in policy retrieval return appropriate error messages to Bedrock Agent

## Notes

- Currently returns hardcoded mock data
- In production, this should connect to actual database/API
- The function uses default policyId if not provided by the agent

