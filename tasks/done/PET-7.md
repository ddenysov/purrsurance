# PET-7: Integrate AWS Bedrock Agent into Lambda Function

## Description
Enhance the `hello-world` Lambda function to integrate AWS Bedrock Agents for AI-powered responses. This integration should support both production deployment and local testing using SAM CLI, enabling efficient development workflow before deploying to AWS.

## Business Logic
1. **Agent Integration**: Connect Lambda function to AWS Bedrock Agent for intelligent responses
2. **Local Testing**: Enable local testing with mocked or actual Bedrock Agent calls
3. **Environment Configuration**: Support different configurations for local/dev/prod environments
4. **Error Handling**: Implement robust error handling for agent invocations
5. **Logging**: Add comprehensive logging for debugging and monitoring

## Technical Overview

### Architecture
```
API Gateway → Lambda Function → AWS Bedrock Agent → Response
                    ↓
              Local Testing (SAM CLI)
                    ↓
              Mock/Real Agent Call
```

### Components
1. **Lambda Handler** - Updated to invoke Bedrock Agent
2. **Agent Client** - AWS SDK Bedrock Agent Runtime client
3. **Configuration** - Environment-based configuration
4. **Local Testing** - SAM CLI local invoke setup
5. **Mock Service** - Optional mock for faster local development

---

## Implementation Steps

### Step 1: Update Lambda Dependencies

**What to do:**
Add AWS Bedrock Agent Runtime SDK to the Lambda function dependencies.

**Code changes in `apps/services/hello-world/package.json`:**

```json
{
  "name": "hello-world",
  "version": "1.0.0",
  "description": "Lambda function with AWS Bedrock Agent integration",
  "type": "module",
  "main": "app.mjs",
  "scripts": {
    "test": "node --experimental-vm-modules ./node_modules/.bin/jest"
  },
  "dependencies": {
    "@aws-sdk/client-bedrock-agent-runtime": "^3.600.0",
    "@aws-sdk/client-bedrock-runtime": "^3.600.0"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
```

**Important notes:**
- Use latest AWS SDK v3 for Bedrock
- Both agent-runtime and bedrock-runtime may be needed depending on use case
- Keep dependencies up to date

---

### Step 2: Create Configuration Module

**What to do:**
Create a configuration module to manage different environments (local, dev, prod).

**Create new file: `apps/services/hello-world/config.mjs`**

```javascript
/**
 * Configuration for different environments
 * Supports local development, dev, and production environments
 */

export const config = {
  // Environment detection
  environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'local',
  isLocal: process.env.AWS_SAM_LOCAL === 'true',
  
  // AWS Bedrock Agent configuration
  bedrock: {
    // Agent ID from AWS Bedrock Agents
    agentId: process.env.BEDROCK_AGENT_ID || '',
    
    // Agent Alias ID (use TSTALIASID for testing, or specific alias)
    agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID',
    
    // AWS Region
    region: process.env.AWS_REGION || 'us-east-1',
    
    // Session configuration
    sessionConfig: {
      // Enable session state tracking
      enableTrace: process.env.ENABLE_BEDROCK_TRACE === 'true',
      
      // Max tokens for response
      maxTokens: parseInt(process.env.MAX_TOKENS || '2048', 10),
    },
    
    // Local mock configuration
    useMock: process.env.USE_BEDROCK_MOCK === 'true',
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableDebug: process.env.DEBUG === 'true',
  },
  
  // CORS configuration
  cors: {
    allowOrigin: process.env.CORS_ORIGIN || '*',
    allowMethods: process.env.CORS_METHODS || '*',
    allowHeaders: process.env.CORS_HEADERS || '*',
    maxAge: parseInt(process.env.CORS_MAX_AGE || '600', 10),
  },
};

/**
 * Validate required configuration
 * @throws {Error} if required config is missing
 */
export function validateConfig() {
  const errors = [];
  
  if (!config.bedrock.useMock && !config.bedrock.agentId) {
    errors.push('BEDROCK_AGENT_ID is required when not using mock');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n- ${errors.join('\n- ')}`);
  }
}

/**
 * Get printable config (without sensitive data)
 */
export function getPrintableConfig() {
  return {
    environment: config.environment,
    isLocal: config.isLocal,
    bedrock: {
      agentId: config.bedrock.agentId ? '***' + config.bedrock.agentId.slice(-4) : 'not set',
      agentAliasId: config.bedrock.agentAliasId,
      region: config.bedrock.region,
      useMock: config.bedrock.useMock,
    },
    logging: config.logging,
  };
}
```

---

### Step 3: Create Bedrock Agent Client

**What to do:**
Create a client module to interact with AWS Bedrock Agent.

**Create new file: `apps/services/hello-world/bedrockClient.mjs`**

```javascript
/**
 * AWS Bedrock Agent Runtime Client
 * Handles communication with AWS Bedrock Agents
 */

import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { config } from './config.mjs';
import { logger } from './logger.mjs';

/**
 * Initialize Bedrock Agent Runtime Client
 */
function createBedrockClient() {
  // For local development, you might want to use localstack or mock
  const clientConfig = {
    region: config.bedrock.region,
  };
  
  // Add endpoint override for local testing if needed
  if (config.isLocal && process.env.BEDROCK_ENDPOINT) {
    clientConfig.endpoint = process.env.BEDROCK_ENDPOINT;
  }
  
  return new BedrockAgentRuntimeClient(clientConfig);
}

let bedrockClient = null;

/**
 * Get or create Bedrock client instance (singleton)
 */
function getBedrockClient() {
  if (!bedrockClient) {
    bedrockClient = createBedrockClient();
  }
  return bedrockClient;
}

/**
 * Mock response for local development
 * @param {string} inputText - User input
 * @returns {Promise<Object>} Mock response
 */
async function getMockResponse(inputText) {
  logger.info('Using mock Bedrock Agent response');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    completion: `Mock Agent Response: You said "${inputText}". This is a simulated response for local testing.`,
    sessionId: `mock-session-${Date.now()}`,
    contentType: 'text/plain',
  };
}

/**
 * Invoke AWS Bedrock Agent
 * @param {string} inputText - User input text
 * @param {string} sessionId - Optional session ID for conversation continuity
 * @returns {Promise<Object>} Agent response
 */
export async function invokeBedrockAgent(inputText, sessionId = null) {
  try {
    // Use mock for local development if configured
    if (config.bedrock.useMock) {
      return await getMockResponse(inputText);
    }
    
    logger.info('Invoking Bedrock Agent', {
      agentId: config.bedrock.agentId,
      inputLength: inputText.length,
      hasSessionId: !!sessionId,
    });
    
    const client = getBedrockClient();
    
    // Prepare command parameters
    const commandParams = {
      agentId: config.bedrock.agentId,
      agentAliasId: config.bedrock.agentAliasId,
      sessionId: sessionId || `session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      inputText: inputText,
      enableTrace: config.bedrock.sessionConfig.enableTrace,
    };
    
    logger.debug('Bedrock Agent command parameters', commandParams);
    
    const command = new InvokeAgentCommand(commandParams);
    const response = await client.send(command);
    
    // Process the response stream
    const completion = await processResponseStream(response);
    
    logger.info('Bedrock Agent invocation successful', {
      sessionId: commandParams.sessionId,
      responseLength: completion.length,
    });
    
    return {
      completion: completion,
      sessionId: commandParams.sessionId,
      contentType: 'text/plain',
      trace: config.bedrock.sessionConfig.enableTrace ? response.trace : undefined,
    };
  } catch (error) {
    logger.error('Error invoking Bedrock Agent', {
      error: error.message,
      stack: error.stack,
      agentId: config.bedrock.agentId,
    });
    
    throw new Error(`Failed to invoke Bedrock Agent: ${error.message}`);
  }
}

/**
 * Process the response stream from Bedrock Agent
 * @param {Object} response - Bedrock Agent response
 * @returns {Promise<string>} Processed completion text
 */
async function processResponseStream(response) {
  const chunks = [];
  
  try {
    // Bedrock Agent returns a stream of chunks
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk && chunk.chunk.bytes) {
          const decodedChunk = new TextDecoder('utf-8').decode(chunk.chunk.bytes);
          chunks.push(decodedChunk);
          
          logger.debug('Received chunk', {
            chunkSize: decodedChunk.length,
          });
        }
      }
    }
    
    return chunks.join('');
  } catch (error) {
    logger.error('Error processing response stream', {
      error: error.message,
      chunksReceived: chunks.length,
    });
    
    throw new Error(`Failed to process response stream: ${error.message}`);
  }
}

/**
 * Test Bedrock Agent connection
 * Useful for health checks and debugging
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testBedrockConnection() {
  try {
    logger.info('Testing Bedrock Agent connection');
    
    const result = await invokeBedrockAgent('Hello, this is a connection test');
    
    return result && result.completion && result.completion.length > 0;
  } catch (error) {
    logger.error('Bedrock connection test failed', { error: error.message });
    return false;
  }
}
```

---

### Step 4: Create Logger Module

**What to do:**
Create a simple logger for structured logging.

**Create new file: `apps/services/hello-world/logger.mjs`**

```javascript
/**
 * Simple structured logger
 * Supports different log levels and structured data
 */

import { config } from './config.mjs';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = LOG_LEVELS[config.logging.level] || LOG_LEVELS.info;

/**
 * Format log message
 */
function formatLog(level, message, data = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...data,
  };
  
  // In AWS Lambda, logs are automatically captured by CloudWatch
  return JSON.stringify(logEntry);
}

/**
 * Log at specific level
 */
function log(level, message, data) {
  if (LOG_LEVELS[level] <= currentLevel) {
    console.log(formatLog(level, message, data));
  }
}

export const logger = {
  error: (message, data) => log('error', message, data),
  warn: (message, data) => log('warn', message, data),
  info: (message, data) => log('info', message, data),
  debug: (message, data) => log('debug', message, data),
};
```

---

### Step 5: Update Lambda Handler

**What to do:**
Update the Lambda handler to use Bedrock Agent for responses.

**Update file: `apps/services/hello-world/app.mjs`**

```javascript
/**
 * Lambda function handler with AWS Bedrock Agent integration
 * 
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 */

import { config, validateConfig, getPrintableConfig } from './config.mjs';
import { invokeBedrockAgent, testBedrockConnection } from './bedrockClient.mjs';
import { logger } from './logger.mjs';

/**
 * Initialize handler (runs once per cold start)
 */
async function initialize() {
  try {
    logger.info('Initializing Lambda function', {
      config: getPrintableConfig(),
    });
    
    // Validate configuration
    validateConfig();
    
    // Test connection in non-local environments
    if (!config.isLocal && !config.bedrock.useMock) {
      const isConnected = await testBedrockConnection();
      if (!isConnected) {
        logger.warn('Bedrock Agent connection test failed during initialization');
      }
    }
    
    logger.info('Lambda function initialized successfully');
  } catch (error) {
    logger.error('Initialization error', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

// Initialize on cold start
await initialize();

/**
 * Create standard API Gateway response
 */
function createResponse(statusCode, body, additionalHeaders = {}) {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': config.cors.allowOrigin,
      'Access-Control-Allow-Methods': config.cors.allowMethods,
      'Access-Control-Allow-Headers': config.cors.allowHeaders,
      'Access-Control-Max-Age': config.cors.maxAge.toString(),
      ...additionalHeaders,
    },
  };
}

/**
 * Parse request body
 */
function parseRequestBody(event) {
  try {
    if (!event.body) {
      return {};
    }
    
    return typeof event.body === 'string' 
      ? JSON.parse(event.body) 
      : event.body;
  } catch (error) {
    logger.error('Error parsing request body', { error: error.message });
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Main Lambda handler
 */
export const lambdaHandler = async (event, context) => {
  const requestId = context.requestId || 'local-' + Date.now();
  
  logger.info('Processing request', {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
    isLocal: config.isLocal,
  });
  
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      logger.debug('Handling CORS preflight request');
      return createResponse(200, { message: 'OK' });
    }
    
    // Parse request body
    const body = parseRequestBody(event);
    const { message, sessionId } = body;
    
    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      logger.warn('Invalid message in request', { body });
      return createResponse(400, {
        error: 'Bad Request',
        message: 'Field "message" is required and must be a non-empty string',
      });
    }
    
    logger.info('Invoking Bedrock Agent', {
      requestId,
      messageLength: message.length,
      hasSessionId: !!sessionId,
    });
    
    // Invoke Bedrock Agent
    const agentResponse = await invokeBedrockAgent(message, sessionId);
    
    logger.info('Request processed successfully', {
      requestId,
      responseLength: agentResponse.completion.length,
    });
    
    // Return successful response
    return createResponse(200, {
      message: 'Success',
      data: {
        response: agentResponse.completion,
        sessionId: agentResponse.sessionId,
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        environment: config.environment,
      },
    });
    
  } catch (error) {
    logger.error('Error processing request', {
      requestId,
      error: error.message,
      stack: error.stack,
    });
    
    // Return error response
    return createResponse(500, {
      error: 'Internal Server Error',
      message: error.message,
      requestId,
    });
  }
};
```

---

### Step 6: Create Local Testing Configuration

**What to do:**
Create environment file for local testing with SAM CLI.

**Create new file: `apps/services/hello-world/env.json`**

```json
{
  "HelloWorldFunction": {
    "ENVIRONMENT": "local",
    "AWS_SAM_LOCAL": "true",
    "LOG_LEVEL": "debug",
    "DEBUG": "true",
    "USE_BEDROCK_MOCK": "true",
    "BEDROCK_AGENT_ID": "your-agent-id-here",
    "BEDROCK_AGENT_ALIAS_ID": "TSTALIASID",
    "AWS_REGION": "us-east-1",
    "ENABLE_BEDROCK_TRACE": "false",
    "MAX_TOKENS": "2048",
    "CORS_ORIGIN": "*",
    "CORS_METHODS": "*",
    "CORS_HEADERS": "*",
    "CORS_MAX_AGE": "600"
  }
}
```

**Important notes:**
- Set `USE_BEDROCK_MOCK` to `true` for fast local testing without AWS
- Set to `false` to test with actual Bedrock Agent (requires AWS credentials)
- Update `BEDROCK_AGENT_ID` with your actual agent ID for real testing

---

### Step 7: Create Test Event

**What to do:**
Create sample event for local testing.

**Create new file: `apps/services/hello-world/events/bedrock-test.json`**

```json
{
  "httpMethod": "POST",
  "path": "/",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": "{\"message\": \"What insurance options do you have for cats?\", \"sessionId\": \"test-session-123\"}"
}
```

---

### Step 8: Update SAM Template

**What to do:**
Update SAM template to include environment variables and proper permissions.

**Update file: `apps/services/template.yaml`**

Find the `HelloWorldFunction` definition and add environment variables and IAM permissions:

```yaml
HelloWorldFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: hello-world/
    Handler: app.lambdaHandler
    Runtime: nodejs20.x
    Architectures:
      - x86_64
    Environment:
      Variables:
        ENVIRONMENT: !Ref Environment
        BEDROCK_AGENT_ID: !Ref BedrockAgentId
        BEDROCK_AGENT_ALIAS_ID: !Ref BedrockAgentAliasId
        AWS_REGION: !Ref AWS::Region
        LOG_LEVEL: info
        ENABLE_BEDROCK_TRACE: false
        MAX_TOKENS: 2048
    Policies:
      - Statement:
          - Sid: BedrockAgentInvokePolicy
            Effect: Allow
            Action:
              - bedrock:InvokeAgent
              - bedrock:InvokeModel
            Resource:
              - !Sub "arn:aws:bedrock:${AWS::Region}:${AWS::AccountId}:agent/*"
              - !Sub "arn:aws:bedrock:${AWS::Region}:${AWS::AccountId}:agent-alias/*"
    Events:
      HelloWorld:
        Type: Api
        Properties:
          Path: /hello
          Method: post

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - staging
      - prod
    Description: Environment name
  
  BedrockAgentId:
    Type: String
    Description: AWS Bedrock Agent ID
    NoEcho: true
  
  BedrockAgentAliasId:
    Type: String
    Default: TSTALIASID
    Description: AWS Bedrock Agent Alias ID

Outputs:
  HelloWorldApi:
    Description: "API Gateway endpoint URL for Hello World function"
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/hello/"
  HelloWorldFunction:
    Description: "Hello World Lambda Function ARN"
    Value: !GetAtt HelloWorldFunction.Arn
```

---

### Step 9: Create Local Testing Scripts

**What to do:**
Create convenient scripts for local testing.

**Create new file: `apps/services/hello-world/test-local.sh`**

```bash
#!/bin/bash

# Local testing script for Bedrock Agent Lambda function
# Usage: ./test-local.sh [mock|real]

MODE=${1:-mock}

echo "🧪 Testing Lambda function locally..."
echo "Mode: $MODE"

# Set environment for testing
export AWS_SAM_LOCAL=true

if [ "$MODE" = "real" ]; then
    echo "📡 Using REAL Bedrock Agent (requires AWS credentials)"
    # Update env.json to use real agent
    jq '.HelloWorldFunction.USE_BEDROCK_MOCK = "false"' env.json > env.json.tmp && mv env.json.tmp env.json
else
    echo "🎭 Using MOCK Bedrock Agent"
    # Update env.json to use mock
    jq '.HelloWorldFunction.USE_BEDROCK_MOCK = "true"' env.json > env.json.tmp && mv env.json.tmp env.json
fi

# Build the function
echo "🔨 Building Lambda function..."
cd .. && sam build && cd hello-world || exit 1

# Invoke locally
echo "🚀 Invoking Lambda function..."
cd .. && sam local invoke HelloWorldFunction \
  --event hello-world/events/bedrock-test.json \
  --env-vars hello-world/env.json

echo ""
echo "✅ Test completed!"
```

Make it executable:
```bash
chmod +x apps/services/hello-world/test-local.sh
```

**Create new file: `apps/services/hello-world/start-local-api.sh`**

```bash
#!/bin/bash

# Start local API Gateway for interactive testing
# Usage: ./start-local-api.sh [mock|real]

MODE=${1:-mock}

echo "🌐 Starting local API Gateway..."
echo "Mode: $MODE"

export AWS_SAM_LOCAL=true

if [ "$MODE" = "real" ]; then
    echo "📡 Using REAL Bedrock Agent"
    jq '.HelloWorldFunction.USE_BEDROCK_MOCK = "false"' env.json > env.json.tmp && mv env.json.tmp env.json
else
    echo "🎭 Using MOCK Bedrock Agent"
    jq '.HelloWorldFunction.USE_BEDROCK_MOCK = "true"' env.json > env.json.tmp && mv env.json.tmp env.json
fi

# Build first
echo "🔨 Building Lambda function..."
cd .. && sam build && cd hello-world || exit 1

# Start API
echo "🚀 Starting API on http://localhost:3000"
echo ""
echo "Test with:"
echo "curl -X POST http://localhost:3000/hello \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"message\": \"Hello from local API!\"}'"
echo ""

cd .. && sam local start-api \
  --env-vars hello-world/env.json \
  --host 0.0.0.0 \
  --port 3000
```

Make it executable:
```bash
chmod +x apps/services/hello-world/start-local-api.sh
```

---

### Step 10: Create Documentation

**What to do:**
Create comprehensive documentation for the integration.

**Create new file: `apps/services/hello-world/README.md`**

```markdown
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
stack_name = "vet-expert-dev"
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
sam logs -n HelloWorldFunction --stack-name vet-expert-dev --tail
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
```

---

## Acceptance Criteria

- [ ] Dependencies installed and configured
- [ ] Configuration module created with environment support
- [ ] Bedrock Agent client implemented
- [ ] Logger module created
- [ ] Lambda handler updated with Bedrock integration
- [ ] Local testing configuration created
- [ ] Test events created
- [ ] SAM template updated with proper permissions
- [ ] Test scripts created and working
- [ ] Mock mode works locally without AWS
- [ ] Real agent mode works locally with AWS credentials
- [ ] Function deploys successfully to AWS
- [ ] Integration with Bedrock Agent works in AWS
- [ ] Comprehensive documentation created
- [ ] Error handling working properly
- [ ] Logging working in local and AWS environments

---

## Testing Checklist

### Local Testing (Mock Mode)
1. [ ] `npm install` completes without errors
2. [ ] `./test-local.sh mock` runs successfully
3. [ ] Mock response contains expected data
4. [ ] Response time is fast (<1 second)
5. [ ] Logs show mock is being used

### Local Testing (Real Agent)
1. [ ] AWS credentials configured
2. [ ] Agent ID configured in env.json
3. [ ] `./test-local.sh real` runs successfully
4. [ ] Real agent response received
5. [ ] Session ID maintained across requests
6. [ ] Logs show actual Bedrock calls

### Local API Gateway
1. [ ] `./start-local-api.sh` starts without errors
2. [ ] API accessible at http://localhost:3000
3. [ ] POST request returns valid response
4. [ ] CORS headers present in response
5. [ ] Error handling works for invalid requests

### AWS Deployment
1. [ ] `sam build` completes successfully
2. [ ] `sam deploy` succeeds
3. [ ] API Gateway endpoint created
4. [ ] Lambda function has correct IAM permissions
5. [ ] Environment variables set correctly
6. [ ] POST request to AWS endpoint works
7. [ ] CloudWatch logs show function execution
8. [ ] Bedrock Agent invoked successfully

---

## Important Notes for AI Agent

### DO:
✅ Test locally with mock before deploying to AWS
✅ Verify AWS credentials before testing with real agent
✅ Check that Docker is running for SAM CLI
✅ Install all dependencies before testing
✅ Validate configuration before deployment
✅ Test error handling scenarios
✅ Review CloudWatch logs after deployment
✅ Update agent ID in configuration
✅ Make scripts executable (chmod +x)
✅ Test both mock and real modes

### DON'T:
❌ Don't commit AWS credentials or agent IDs to git
❌ Don't skip local testing before deployment
❌ Don't forget to install npm dependencies
❌ Don't use real agent for every test (use mock for iteration)
❌ Don't ignore error logs
❌ Don't deploy without updating SAM template parameters
❌ Don't forget to add .env files to .gitignore
❌ Don't skip IAM permission configuration
❌ Don't forget to handle Bedrock streaming responses
❌ Don't ignore timeout configuration

### Security Considerations:
- Never commit `env.json` with real agent IDs
- Use AWS Secrets Manager for production
- Implement proper error messages (don't expose internals)
- Enable CloudTrail for audit logging
- Use least-privilege IAM policies
- Validate and sanitize all inputs

### Performance Considerations:
- Use mock mode for rapid local development
- Cache agent responses when appropriate
- Set appropriate Lambda timeout (Bedrock calls can be slow)
- Monitor CloudWatch metrics
- Consider implementing connection pooling
- Handle cold starts gracefully

### Cost Optimization:
- Use mock mode for development to avoid Bedrock costs
- Implement caching for repeated queries
- Set appropriate timeout limits
- Monitor Bedrock token usage
- Use Lambda Provisioned Concurrency carefully

---

## Priority
High

## Estimated Time
6-8 hours (including testing and documentation)

## Created
2025-10-06

## Assignee
AI Agent / Dmytro

## Labels
aws, bedrock, lambda, ai, agents, integration, sam, local-development

## Dependencies
- PET-6 (Local Development Environment) - should be completed first
- AWS Bedrock Agent created in AWS account
- AWS SAM CLI installed and configured
- Docker running for SAM CLI local testing

## Files to Create/Modify

### Create:
1. `apps/services/hello-world/config.mjs`
2. `apps/services/hello-world/bedrockClient.mjs`
3. `apps/services/hello-world/logger.mjs`
4. `apps/services/hello-world/env.json`
5. `apps/services/hello-world/events/bedrock-test.json`
6. `apps/services/hello-world/test-local.sh`
7. `apps/services/hello-world/start-local-api.sh`
8. `apps/services/hello-world/README.md`

### Modify:
1. `apps/services/hello-world/package.json` (add dependencies)
2. `apps/services/hello-world/app.mjs` (update handler)
3. `apps/services/template.yaml` (add environment vars and permissions)
4. `apps/services/hello-world/.gitignore` (add env files)

## External Resources
- [AWS Bedrock Agent Runtime SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/bedrock-agent-runtime/)
- [AWS SAM Local Testing](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-invoke.html)
- [AWS Bedrock Agents Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [Lambda Environment Variables](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html)

---

## Success Criteria Summary

**Integration:**
1. Lambda function successfully calls AWS Bedrock Agent
2. Proper error handling and retry logic
3. Session management working
4. Structured logging implemented

**Local Development:**
1. Mock mode works without AWS
2. Real agent mode works with AWS credentials
3. Local API Gateway functional
4. Fast iteration possible with mock

**Deployment:**
1. Function deploys to AWS without errors
2. IAM permissions correctly configured
3. Environment variables set properly
4. Integration working in AWS environment

**Documentation:**
1. Complete setup instructions
2. Testing guide included
3. Troubleshooting section helpful
4. API reference clear and accurate

