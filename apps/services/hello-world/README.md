# Hello World Lambda Function with AWS Bedrock Agent

Lambda function that integrates with AWS Bedrock Agents to provide AI-powered responses. Supports both local development and AWS deployment.

## Features

- ✅ AWS Bedrock Agent integration
- ✅ Local testing with mock responses
- ✅ Local testing with real Bedrock Agent
- ✅ Structured logging
- ✅ Environment-based configuration
- ✅ CORS support
- ✅ Error handling
- ✅ Session management

## Prerequisites

### For Local Development
- Node.js 20+
- AWS SAM CLI installed
- Docker running (for SAM CLI)
- jq (for test scripts)

### For AWS Deployment
- AWS account with Bedrock access
- AWS Bedrock Agent created
- Appropriate IAM permissions

## Installation

```bash
cd apps/services/hello-world
npm install
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENVIRONMENT` | Environment name (local/dev/prod) | `local` | No |
| `BEDROCK_AGENT_ID` | AWS Bedrock Agent ID | - | Yes* |
| `BEDROCK_AGENT_ALIAS_ID` | Agent alias ID | `TSTALIASID` | No |
| `AWS_REGION` | AWS region | `us-east-1` | No |
| `USE_BEDROCK_MOCK` | Use mock instead of real agent | `false` | No |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | `info` | No |
| `DEBUG` | Enable debug mode | `false` | No |
| `ENABLE_BEDROCK_TRACE` | Enable Bedrock tracing | `false` | No |
| `MAX_TOKENS` | Max tokens for response | `2048` | No |

*Required only when `USE_BEDROCK_MOCK` is `false`

### Local Configuration

Edit `env.json` to configure local environment:

```json
{
  "HelloWorldFunction": {
    "USE_BEDROCK_MOCK": "true",
    "BEDROCK_AGENT_ID": "your-agent-id",
    "LOG_LEVEL": "debug"
  }
}
```

## Local Testing

### Option 1: Quick Test with Mock

```bash
./test-local.sh mock
```

This runs a single invocation with mocked Bedrock responses (fast, no AWS needed).

### Option 2: Test with Real Bedrock Agent

```bash
# Make sure AWS credentials are configured
aws configure

# Update env.json with your agent ID
# Then run:
./test-local.sh real
```

### Option 3: Start Local API Gateway

```bash
# Start with mock
./start-local-api.sh mock

# Or start with real agent
./start-local-api.sh real
```

API will be available at `http://localhost:3000`

### Manual Testing

**Build function:**
```bash
cd apps/services
sam build
```

**Invoke with event:**
```bash
sam local invoke HelloWorldFunction \
  --event hello-world/events/bedrock-test.json \
  --env-vars hello-world/env.json
```

**Start local API:**
```bash
sam local start-api \
  --env-vars hello-world/env.json \
  --port 3000
```

**Test with curl:**
```bash
curl -X POST http://localhost:3000/hello \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "What insurance do you offer for cats?",
    "sessionId": "test-123"
  }'
```

## API Reference

### Endpoint

`POST /hello`

### Request Body

```json
{
  "message": "Your question here",
  "sessionId": "optional-session-id"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | User's message/question |
| `sessionId` | string | No | Session ID for conversation continuity |

### Response

**Success (200):**
```json
{
  "message": "Success",
  "data": {
    "response": "Agent's response text",
    "sessionId": "session-123"
  },
  "metadata": {
    "requestId": "abc-123",
    "timestamp": "2025-10-06T12:00:00Z",
    "environment": "local"
  }
}
```

**Error (400):**
```json
{
  "error": "Bad Request",
  "message": "Field \"message\" is required and must be a non-empty string"
}
```

**Error (500):**
```json
{
  "error": "Internal Server Error",
  "message": "Error details",
  "requestId": "abc-123"
}
```

## Deployment

### Deploy to AWS

```bash
cd apps/services

# Build
sam build

# Deploy (first time)
sam deploy --guided

# Subsequent deploys
sam deploy \
  --parameter-overrides \
    BedrockAgentId=YOUR_AGENT_ID \
    BedrockAgentAliasId=TSTALIASID \
    Environment=dev
```

### Deploy with Parameters

Create `samconfig.toml`:

```toml
[dev.deploy.parameters]
stack_name = "purrsurance-dev"
s3_bucket = "your-deployment-bucket"
region = "us-east-1"
parameter_overrides = "BedrockAgentId=AGENT_ID BedrockAgentAliasId=TSTALIASID Environment=dev"
```

Then deploy:
```bash
sam deploy --config-env dev
```

## Architecture

```
┌─────────────────┐
│  API Gateway    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Lambda Function │────▶│ AWS Bedrock      │
│  (app.mjs)      │     │ Agent            │
└─────────────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐
│  CloudWatch     │
│  Logs           │
└─────────────────┘
```

## Development Workflow

1. **Local Development with Mock:**
   - Fast iteration
   - No AWS costs
   - No network latency
   ```bash
   ./start-local-api.sh mock
   ```

2. **Local Testing with Real Agent:**
   - Test actual Bedrock integration
   - Verify agent behavior
   - Debug issues
   ```bash
   ./start-local-api.sh real
   ```

3. **Deploy to Dev:**
   - Test in AWS environment
   - Verify IAM permissions
   - Check CloudWatch logs
   ```bash
   sam deploy --config-env dev
   ```

4. **Deploy to Production:**
   - Full testing completed
   - Monitoring configured
   ```bash
   sam deploy --config-env prod
   ```

## Troubleshooting

### Mock Not Working

**Check environment:**
```bash
cat env.json | grep USE_BEDROCK_MOCK
# Should be "true"
```

### Real Agent Not Working

**Verify AWS credentials:**
```bash
aws sts get-caller-identity
```

**Check agent ID:**
```bash
aws bedrock-agent list-agents --region us-east-1
```

**Test agent directly:**
```bash
aws bedrock-agent-runtime invoke-agent \
  --agent-id YOUR_AGENT_ID \
  --agent-alias-id TSTALIASID \
  --session-id test \
  --input-text "Hello"
```

### Lambda Timeout

Increase timeout in `template.yaml`:
```yaml
HelloWorldFunction:
  Properties:
    Timeout: 30  # Increase from default 3 seconds
```

### Permission Denied

Check IAM policy in `template.yaml` includes:
```yaml
Policies:
  - Statement:
      - Effect: Allow
        Action:
          - bedrock:InvokeAgent
        Resource: "*"
```

## Logging

View logs locally:
- Logs appear in console when running `sam local`

View logs in AWS:
```bash
sam logs -n HelloWorldFunction --stack-name purrsurance-dev --tail
```

## Cost Estimation

- **Lambda:** Free tier includes 1M requests/month
- **Bedrock:** Varies by model (~$0.002 per 1K tokens)
- **API Gateway:** $3.50 per million requests

**Estimated cost for 10K requests/month:** ~$0.50

## Security

- Use AWS Secrets Manager for sensitive configuration
- Enable AWS CloudTrail for audit logging
- Implement request rate limiting in production
- Use least-privilege IAM policies
- Enable AWS WAF for API Gateway in production

## Next Steps

- [ ] Add unit tests with Jest
- [ ] Add integration tests
- [ ] Implement caching for repeated queries
- [ ] Add request rate limiting
- [ ] Set up CloudWatch alarms
- [ ] Implement API key authentication
- [ ] Add request validation with JSON schema
- [ ] Implement response streaming for long responses

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review this documentation
3. Check AWS Bedrock Agent console
4. Review SAM CLI documentation

## References

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)

