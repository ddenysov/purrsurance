# Event Publisher Service

AWS Lambda function that publishes events directly to DynamoDB, combining Producer and Saver logic into a single service.

## Overview

This service simplifies the event architecture by eliminating SNS topic and directly saving events to DynamoDB:
- Receives HTTP POST requests via API Gateway
- Validates sessionId and eventType
- Saves events directly to DynamoDB
- Returns success/error response to the caller

## Architecture

**Before (2 services + SNS):**
```
API Gateway → Producer Lambda → SNS Topic → Saver Lambda → DynamoDB
```

**After (1 service):**
```
API Gateway → Event Publisher Lambda → DynamoDB
```

### Benefits:
- ✅ Simpler architecture
- ✅ Lower latency (no SNS hop)
- ✅ Reduced cost (one less Lambda + no SNS)
- ✅ Fewer failure points
- ✅ Easier to maintain and debug

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EVENTS_TABLE_NAME` | DynamoDB table name for storing events | Yes |
| `ENVIRONMENT` | Environment (prod) | No |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | No |
| `NODE_ENV` | Node environment (development/production) | No |

## Request Format

### Endpoint
`POST /publish`

### Request Body
```json
{
  "sessionId": "session-abc-123",
  "eventType": "PolicyUpdate",
  "data": {
    "policyId": "POLICY-123",
    "action": "update",
    "timestamp": "2025-10-08T12:00:00Z",
    "changes": {
      "coverage": 150000
    }
  }
}
```

### Fields
- `sessionId` (required): Session identifier (can also be passed as `X-Session-Id` header)
- `eventType` (optional): Type of event, defaults to "PolicyUpdate"
- `data` (optional): Event payload

## Response Format

### Success (200)
```json
{
  "success": true,
  "message": "Event published successfully",
  "sessionId": "session-abc-123",
  "eventType": "PolicyUpdate",
  "timestamp": "2025-10-08T12:00:00.123Z",
  "requestId": "a1b2c3d4-e5f6-7890"
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

## DynamoDB Schema

Events are stored with the following structure:

| Attribute | Type | Description |
|-----------|------|-------------|
| `partitionKey` | String (Hash Key) | sessionId for session isolation |
| `timestamp` | Number (Range Key) | Unix timestamp in milliseconds |
| `payload` | Object | Event data payload |
| `eventType` | String | Type of event |
| `requestId` | String | Lambda request ID for tracing |

## Error Handling

The function handles:
- Empty request body (400)
- Invalid JSON format (400)
- Missing sessionId (400)
- Missing table name configuration (500)
- DynamoDB write errors (500)

## Local Testing

### Prerequisites
```bash
# Install dependencies
npm install

# Configure environment
cp env.json.example env.json
# Edit env.json with your test values
```

### Run tests
```bash
# Test with default event
./test-local.sh

# Test with custom event
sam local invoke EventPublisherFunction -e events/test.json --env-vars env.json
```

## Deployment

### Prerequisites
- AWS CLI configured
- SAM CLI installed
- Appropriate AWS permissions

### Deploy
```bash
# Build
make build

# Deploy
make deploy

# Or use SAM directly
sam build
sam deploy --guided
```

### Stack Parameters
- `Environment`: Environment name (default: prod)
- `LogLevel`: Logging level (default: info)

## Stack Outputs

After deployment, the stack exports:
- `EventPublisherApi` - API Gateway endpoint URL
- `EventPublisherFunction` - Lambda function ARN
- `EventsTableName` - DynamoDB table name
- `EventsTableArn` - DynamoDB table ARN

## Monitoring

### CloudWatch Metrics
- Invocation count
- Error rate
- Duration
- DynamoDB write latency

### CloudWatch Logs
JSON formatted logs include:
- Request ID for tracing
- Session ID
- Event type
- Timestamp
- Detailed error information

## Security

- DynamoDB table encryption at rest (SSE enabled)
- Point-in-time recovery enabled
- IAM role with least privilege access
- API Gateway CORS configured

## Cost Optimization

- Pay-per-request DynamoDB billing
- 256 MB Lambda memory allocation
- Connection reuse enabled for AWS SDK
- No SNS topic costs
- No additional Lambda invocation

## Migration from Old Architecture

If migrating from the old Producer/SNS/Saver architecture:

1. Deploy this new service
2. Update frontend/clients to use new API endpoint
3. Verify events are being saved correctly
4. Remove old Producer and Saver services
5. Delete SNS topic

## Troubleshooting

### Event not saved
- Check CloudWatch logs for errors
- Verify sessionId is provided
- Verify DynamoDB table permissions
- Check table name environment variable

### High latency
- Check DynamoDB table metrics
- Verify table is in same region as Lambda
- Check Lambda memory allocation
- Review CloudWatch logs for bottlenecks

## Development

### Project Structure
```
service-event-publisher/
├── app.mjs              # Lambda handler
├── package.json         # Dependencies
├── template.yaml        # SAM template
├── samconfig.toml       # SAM configuration
├── Makefile            # Build/deploy commands
├── README.md           # This file
├── env.json.example    # Environment variables template
├── events/             # Test events
│   ├── test.json
│   └── test-claim.json
└── test-local.sh       # Local testing script
```

### Adding New Features
1. Update `app.mjs` with new logic
2. Update `template.yaml` if new resources needed
3. Update this README
4. Test locally before deploying
5. Deploy and verify

## Related Services

- `service-router` - Routes chat messages to Bedrock agents
- `agent-intention-classifier` - Classifies user intentions

## Support

For issues or questions, check CloudWatch logs or contact the development team.

