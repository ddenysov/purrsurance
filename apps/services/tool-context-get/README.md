# Tool: GetContext

Lambda function that retrieves contextual information from session context for AWS Bedrock Agents.

## Purpose

This tool allows Bedrock Agents to retrieve previously saved contextual information such as:
- Medical diagnoses
- Symptoms and complaints
- Treatment plans
- Medication information
- Allergies
- Notes and recommendations
- Any other contextual data saved during the session

## Features

- **Complete Retrieval**: Always returns all context data from the session
- **Timestamp Tracking**: All retrieved data includes timestamps from when it was saved
- **Session Isolation**: Each session has its own isolated context
- **Error Handling**: Graceful handling of missing data
- **Event Publishing**: Publishes events to Event Publisher for audit trail

## Parameters

### sessionId (required)
- **Type**: string
- **Description**: The session identifier that was provided at the start of the conversation
- **Behavior**: Uses this ID to retrieve all context data for the specified session
- **Note**: This is the same sessionId from session attributes that the agent receives

## Usage Examples

### Get All Context
```json
{
  "sessionId": "d5a06c3b-cbb9-483d-abed-ff9c59bd4c64"
}
```
Returns complete context with all keys and their data for the specified session.

## Response Format

### Success - All Context
```json
{
  "success": true,
  "message": "All context retrieved successfully",
  "contextData": {
    "diagnosis": [...],
    "symptoms": [...],
    "complaints": [...]
  },
  "contextKeys": ["diagnosis", "symptoms", "complaints"],
  "lastUpdate": 1697123456789
}
```

### No Context Found
```json
{
  "success": false,
  "message": "No context found for this session",
  "contextData": null
}
```

### Missing SessionId
```json
{
  "success": false,
  "message": "Missing required parameter: sessionId",
  "error": "sessionId is required"
}
```

## Development

### Prerequisites
- AWS SAM CLI
- Node.js 20.x
- AWS Account with appropriate permissions

### Local Testing

1. Copy environment configuration:
```bash
cp env.json.example env.json
# Edit env.json with your local DynamoDB table name
```

2. Build and test:
```bash
# Build
make build

# Run all tests
./test-local.sh

# Test specific scenario
sam local invoke GetContextFunction -e events/bedrock-agent-event.json --env-vars env.json
```

### Deployment

1. Update `samconfig.toml` with your stack parameters

2. Deploy:
```bash
make deploy
```

3. Attach to Bedrock Agent:
```bash
./setup-action-group.sh <AGENT_ID>
```

## Integration with SaveContext

This tool works in conjunction with the `tool-context-save` service:

1. **SaveContext** stores information during conversation
2. **GetContext** retrieves stored information when needed
3. Both tools use the same storage (DynamoDB ChatHistory table)
4. Both tools require sessionId parameter
5. Both should be attached to the same agent for full functionality

## Architecture

- **Runtime**: Node.js 20.x
- **Handler**: `app.lambdaHandler`
- **Memory**: 256 MB
- **Timeout**: 30 seconds
- **Storage**: DynamoDB (ChatHistory table)
- **Events**: SNS Topic → Event Publisher
- **Permissions**: Read-only access to DynamoDB

## Environment Variables

- `CHAT_HISTORY_TABLE_NAME`: DynamoDB table name for session storage
- `EVENT_PUBLISHER_URL`: URL for publishing events
- `EVENTS_TOPIC_ARN`: SNS topic for events
- `LOG_LEVEL`: Logging level (error/warn/info/debug)
- `ENVIRONMENT`: Environment name (prod)

## Outputs

CloudFormation stack exports:
- `GetContextFunction`: Lambda Function ARN
- `GetContextFunctionIamRole`: IAM Role ARN
- `ContextEventsTopicArn`: SNS Topic ARN
- `ContextEventsTopicName`: SNS Topic Name

## Notes

- Read-only operation (doesn't modify context)
- Returns data from current session only
- Multiple entries under same key returned as array
- Timestamps automatically included
- Events published for audit trail
- Graceful error handling

