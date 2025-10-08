# Agent Router Service

Lambda function that routes chat messages to AWS Bedrock Agent and manages chat history.

## Architecture

This service provides a REST API endpoint that:
1. Receives user chat messages
2. Routes them to AWS Bedrock Agent
3. Saves conversation history to DynamoDB
4. Returns agent responses

## Prerequisites

- Node.js 20.x
- pnpm
- AWS SAM CLI
- AWS account with Bedrock Agent configured

## Project Structure

```
agent-router/
├── app.mjs                    # Main Lambda handler
├── bedrockClient.mjs          # AWS Bedrock Agent client
├── chatHistoryService.mjs     # DynamoDB chat history service
├── config.mjs                 # Configuration management
├── logger.mjs                 # Structured logging
├── template.yaml              # SAM CloudFormation template
├── samconfig.toml             # SAM CLI configuration
├── Makefile                   # Build and deploy commands
├── package.json               # Dependencies
└── events/                    # Test events
    ├── test-chat.json
    └── test-simple.json
```

## Installation

```bash
make install
```

## Configuration

The service uses environment variables for configuration:

- `ENVIRONMENT` - Environment name (prod)
- `BEDROCK_AGENT_ID` - AWS Bedrock Agent ID (required)
- `BEDROCK_AGENT_ALIAS_ID` - AWS Bedrock Agent Alias ID (default: TSTALIASID)
- `CHAT_HISTORY_TABLE_NAME` - DynamoDB table for chat history
- `LOG_LEVEL` - Logging level (error, warn, info, debug)
- `USE_MOCK_BEDROCK` - Use mock responses for testing (default: false)

## Development

### Build

```bash
make build
```

### Local Testing

Start local API:
```bash
make start-api
```

Invoke with test event:
```bash
sam local invoke AgentRouterFunction -e events/test-chat.json
```

### Validate Template

```bash
make validate
```

## Deployment

### Deploy to AWS

```bash
make deploy
```

This will:
1. Build the application
2. Package and upload to S3
3. Deploy CloudFormation stack
4. Output API endpoint URL

### Required Parameters

When deploying, you'll need to provide:
- `BedrockAgentId` - Your Bedrock Agent ID
- `BedrockAgentAliasId` - Your Bedrock Agent Alias ID
- `ChatHistoryTableName` - DynamoDB table name

### View Logs

```bash
make logs
```

### Delete Stack

```bash
make delete
```

## API Usage

### POST /chat

Send a message to the agent.

**Request:**
```json
{
  "message": "What is my policy coverage?",
  "sessionId": "bedrock-session-id",
  "globalSessionId": "user-session-id"
}
```

**Response:**
```json
{
  "message": "Success",
  "data": {
    "response": "Your policy covers...",
    "sessionId": "bedrock-session-123"
  },
  "metadata": {
    "requestId": "req-123",
    "timestamp": "2025-10-08T12:00:00.000Z",
    "environment": "prod"
  }
}
```

## Features

- ✅ AWS Bedrock Agent integration
- ✅ DynamoDB chat history persistence
- ✅ Session management
- ✅ CORS support
- ✅ Structured logging
- ✅ Mock mode for local development
- ✅ Error handling and validation
- ✅ TTL-based chat history cleanup (90 days)

## Permissions

The Lambda function requires:
- `bedrock:InvokeAgent` - Invoke Bedrock Agent
- `bedrock:InvokeModel` - Invoke Bedrock models
- `dynamodb:PutItem` - Save chat messages
- `dynamodb:Query` - Retrieve chat history

## Monitoring

Logs are sent to CloudWatch Logs in JSON format with structured data:
- Request IDs for tracing
- Performance metrics
- Error details with stack traces

## License

MIT

