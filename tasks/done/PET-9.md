# PET-9: Create Lambda Function for Server-Sent Events (SSE)

## Description
Create a new AWS Lambda function that streams Server-Sent Events (SSE) to clients. This function will enable real-time updates from the backend to the frontend application. Initially, it will send mock events every 10 seconds to demonstrate the SSE functionality.

## Business Logic
1. **SSE Streaming**: Implement Lambda Response Streaming to send SSE events
2. **Mock Events**: Generate sample events every 10 seconds for testing
3. **Connection Management**: Handle client connections and disconnections
4. **Event Format**: Use standard SSE format (event, data, id fields)
5. **Keep-Alive**: Send periodic messages to maintain connection
6. **Error Handling**: Gracefully handle stream errors and timeouts

## Technical Overview

### Architecture
```
API Gateway (HTTP API) → Lambda Function URL → Response Stream → SSE Events
                                    ↓
                            Event Generator (Mock)
                                    ↓
                            Send event every 10 seconds
```

### Components
1. **Lambda Handler** - Main entry point with response streaming
2. **Event Generator** - Mock event producer
3. **SSE Formatter** - Format events in SSE protocol
4. **Stream Manager** - Handle streaming lifecycle
5. **Configuration** - Environment-based settings

### SSE Protocol Format
```
event: message
id: 1
data: {"text": "Hello", "timestamp": "2025-10-06T12:00:00Z"}

event: heartbeat
data: {"status": "alive"}
```

---

## Implementation Steps

### Step 1: Create New Lambda Function Directory

**What to do:**
Create a new directory structure for the SSE Lambda function.

**Commands:**
```bash
cd apps/services
mkdir -p sse-stream/events
```

**Directory structure:**
```
apps/services/sse-stream/
├── app.mjs              # Lambda handler
├── sseFormatter.mjs     # SSE format utilities
├── eventGenerator.mjs   # Mock event generator
├── config.mjs           # Configuration
├── logger.mjs           # Logger
├── package.json         # Dependencies
├── env.json            # Local environment config
├── test-local.sh       # Local test script
├── events/
│   └── test.json       # Test event
└── README.md           # Documentation
```

---

### Step 2: Create Package Configuration

**What to do:**
Create package.json with necessary dependencies.

**Create new file: `apps/services/sse-stream/package.json`**

```json
{
  "name": "sse-stream",
  "version": "1.0.0",
  "description": "Lambda function with Server-Sent Events streaming",
  "type": "module",
  "main": "app.mjs",
  "scripts": {
    "test": "node --experimental-vm-modules ./node_modules/.bin/jest"
  },
  "dependencies": {},
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
```

**Important notes:**
- No external dependencies needed for basic SSE
- Using native Node.js streaming capabilities
- Lambda Response Streaming supported natively

---

### Step 3: Create Configuration Module

**What to do:**
Create configuration for different environments.

**Create new file: `apps/services/sse-stream/config.mjs`**

```javascript
/**
 * Configuration for SSE Lambda function
 * Supports local development and production environments
 */

export const config = {
  // Environment detection
  environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'local',
  isLocal: process.env.AWS_SAM_LOCAL === 'true',
  
  // SSE Configuration
  sse: {
    // Interval between mock events (milliseconds)
    eventInterval: parseInt(process.env.SSE_EVENT_INTERVAL || '10000', 10),
    
    // Maximum stream duration (milliseconds)
    maxStreamDuration: parseInt(process.env.SSE_MAX_DURATION || '300000', 10), // 5 minutes
    
    // Keep-alive interval (milliseconds)
    keepAliveInterval: parseInt(process.env.SSE_KEEPALIVE_INTERVAL || '30000', 10),
    
    // Mock mode
    useMock: process.env.SSE_USE_MOCK !== 'false', // Default true
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableDebug: process.env.DEBUG === 'true',
  },
  
  // CORS configuration
  cors: {
    allowOrigin: process.env.CORS_ORIGIN || '*',
    allowMethods: process.env.CORS_METHODS || 'GET, OPTIONS',
    allowHeaders: process.env.CORS_HEADERS || '*',
    maxAge: parseInt(process.env.CORS_MAX_AGE || '600', 10),
  },
};

/**
 * Get printable config (without sensitive data)
 */
export function getPrintableConfig() {
  return {
    environment: config.environment,
    isLocal: config.isLocal,
    sse: config.sse,
    logging: config.logging,
  };
}
```

---

### Step 4: Create Logger Module

**What to do:**
Create structured logger for the Lambda function.

**Create new file: `apps/services/sse-stream/logger.mjs`**

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

### Step 5: Create SSE Formatter

**What to do:**
Create utilities for formatting SSE protocol messages.

**Create new file: `apps/services/sse-stream/sseFormatter.mjs`**

```javascript
/**
 * Server-Sent Events (SSE) formatter
 * Handles SSE protocol formatting
 */

/**
 * Format SSE message
 * @param {Object} options - Message options
 * @param {string} options.event - Event type (optional)
 * @param {any} options.data - Event data
 * @param {string|number} options.id - Event ID (optional)
 * @param {number} options.retry - Retry interval in ms (optional)
 * @returns {string} Formatted SSE message
 */
export function formatSSE({ event, data, id, retry }) {
  let message = '';
  
  // Add event type
  if (event) {
    message += `event: ${event}\n`;
  }
  
  // Add event ID
  if (id !== undefined) {
    message += `id: ${id}\n`;
  }
  
  // Add retry interval
  if (retry !== undefined) {
    message += `retry: ${retry}\n`;
  }
  
  // Add data (can be multi-line)
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  const dataLines = dataString.split('\n');
  
  for (const line of dataLines) {
    message += `data: ${line}\n`;
  }
  
  // SSE messages end with double newline
  message += '\n';
  
  return message;
}

/**
 * Create a heartbeat/keep-alive message
 * @returns {string} SSE heartbeat message
 */
export function createHeartbeat() {
  return formatSSE({
    event: 'heartbeat',
    data: {
      status: 'alive',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Create an error message
 * @param {string} error - Error message
 * @returns {string} SSE error message
 */
export function createError(error) {
  return formatSSE({
    event: 'error',
    data: {
      error: error,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Create a connection established message
 * @param {string} connectionId - Connection identifier
 * @returns {string} SSE connection message
 */
export function createConnectionMessage(connectionId) {
  return formatSSE({
    event: 'connected',
    id: 0,
    data: {
      connectionId: connectionId,
      message: 'Connection established',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Create a goodbye message
 * @returns {string} SSE goodbye message
 */
export function createGoodbyeMessage() {
  return formatSSE({
    event: 'goodbye',
    data: {
      message: 'Stream closing',
      timestamp: new Date().toISOString(),
    },
  });
}
```

---

### Step 6: Create Mock Event Generator

**What to do:**
Create a generator for mock events.

**Create new file: `apps/services/sse-stream/eventGenerator.mjs`**

```javascript
/**
 * Mock event generator for testing SSE
 * Generates sample events to demonstrate functionality
 */

import { logger } from './logger.mjs';

/**
 * Generate mock pet insurance event
 * @param {number} eventNumber - Sequential event number
 * @returns {Object} Mock event data
 */
export function generateMockEvent(eventNumber) {
  const eventTypes = [
    'policy_update',
    'claim_status',
    'reminder',
    'notification',
    'alert',
  ];
  
  const pets = ['Whiskers', 'Mittens', 'Shadow', 'Luna', 'Max'];
  const statuses = ['approved', 'pending', 'processing', 'completed'];
  const messages = [
    'Your policy has been updated',
    'Claim has been processed',
    'Vaccination reminder for your pet',
    'New benefit available',
    'Important notification',
  ];
  
  // Pick random values
  const eventType = eventTypes[eventNumber % eventTypes.length];
  const pet = pets[eventNumber % pets.length];
  const status = statuses[eventNumber % statuses.length];
  const message = messages[eventNumber % messages.length];
  
  const event = {
    type: eventType,
    id: `evt_${Date.now()}_${eventNumber}`,
    timestamp: new Date().toISOString(),
    data: {
      pet: pet,
      status: status,
      message: message,
      details: {
        eventNumber: eventNumber,
        randomValue: Math.floor(Math.random() * 1000),
      },
    },
  };
  
  logger.debug('Generated mock event', { eventType, eventNumber });
  
  return event;
}

/**
 * Generate a series of mock events
 * @param {number} count - Number of events to generate
 * @returns {Array} Array of mock events
 */
export function generateMockEvents(count) {
  const events = [];
  for (let i = 0; i < count; i++) {
    events.push(generateMockEvent(i));
  }
  return events;
}

/**
 * Async generator for mock events with delay
 * @param {number} intervalMs - Interval between events in milliseconds
 * @param {number} maxEvents - Maximum number of events (optional)
 */
export async function* mockEventStream(intervalMs, maxEvents = Infinity) {
  let eventNumber = 0;
  
  logger.info('Starting mock event stream', { intervalMs, maxEvents });
  
  while (eventNumber < maxEvents) {
    // Generate and yield event
    const event = generateMockEvent(eventNumber);
    yield event;
    
    eventNumber++;
    
    // Wait for interval (if not the last event)
    if (eventNumber < maxEvents) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  
  logger.info('Mock event stream completed', { totalEvents: eventNumber });
}
```

---

### Step 7: Create Lambda Handler with Response Streaming

**What to do:**
Create the main Lambda handler that streams SSE events.

**Create new file: `apps/services/sse-stream/app.mjs`**

```javascript
/**
 * Lambda function handler with Server-Sent Events (SSE) streaming
 * 
 * Uses Lambda Response Streaming to send SSE events to clients
 * Supports both local testing and AWS deployment
 */

import { config, getPrintableConfig } from './config.mjs';
import { logger } from './logger.mjs';
import { 
  formatSSE, 
  createHeartbeat, 
  createError, 
  createConnectionMessage,
  createGoodbyeMessage,
} from './sseFormatter.mjs';
import { mockEventStream } from './eventGenerator.mjs';

/**
 * Initialize handler
 */
function initialize() {
  logger.info('Initializing SSE Lambda function', {
    config: getPrintableConfig(),
  });
}

// Initialize on cold start
initialize();

/**
 * Stream mock events using SSE protocol
 * @param {Object} responseStream - Lambda response stream
 * @param {string} requestId - Request identifier
 */
async function streamMockEvents(responseStream, requestId) {
  let eventCount = 0;
  let keepAliveTimer = null;
  let streamTimer = null;
  const startTime = Date.now();
  
  try {
    // Send connection established message
    const connectionMsg = createConnectionMessage(requestId);
    responseStream.write(connectionMsg);
    logger.info('SSE connection established', { requestId });
    
    // Setup keep-alive timer
    keepAliveTimer = setInterval(() => {
      try {
        const heartbeat = createHeartbeat();
        responseStream.write(heartbeat);
        logger.debug('Sent heartbeat', { requestId });
      } catch (error) {
        logger.error('Error sending heartbeat', { requestId, error: error.message });
      }
    }, config.sse.keepAliveInterval);
    
    // Setup max duration timer
    streamTimer = setTimeout(() => {
      logger.info('Max stream duration reached', { 
        requestId, 
        duration: config.sse.maxStreamDuration 
      });
      responseStream.end();
    }, config.sse.maxStreamDuration);
    
    // Calculate max events based on duration and interval
    const maxEvents = Math.floor(config.sse.maxStreamDuration / config.sse.eventInterval);
    
    // Stream mock events
    for await (const event of mockEventStream(config.sse.eventInterval, maxEvents)) {
      eventCount++;
      
      // Format as SSE message
      const sseMessage = formatSSE({
        event: event.type,
        id: eventCount,
        data: event,
      });
      
      // Write to stream
      responseStream.write(sseMessage);
      
      logger.info('Sent SSE event', { 
        requestId, 
        eventCount, 
        eventType: event.type 
      });
    }
    
    // Send goodbye message
    const goodbyeMsg = createGoodbyeMessage();
    responseStream.write(goodbyeMsg);
    
  } catch (error) {
    logger.error('Error streaming events', {
      requestId,
      error: error.message,
      stack: error.stack,
    });
    
    // Try to send error message
    try {
      const errorMsg = createError(error.message);
      responseStream.write(errorMsg);
    } catch (writeError) {
      logger.error('Failed to write error message', { 
        requestId, 
        error: writeError.message 
      });
    }
  } finally {
    // Cleanup
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
    }
    if (streamTimer) {
      clearTimeout(streamTimer);
    }
    
    const duration = Date.now() - startTime;
    logger.info('SSE stream ended', { 
      requestId, 
      eventCount, 
      duration: `${duration}ms` 
    });
    
    // End the stream
    responseStream.end();
  }
}

/**
 * Lambda handler with response streaming
 * 
 * Note: This uses Lambda Response Streaming which requires:
 * - Lambda Function URL or API Gateway with streaming enabled
 * - InvokeMode: RESPONSE_STREAM in SAM template
 */
export const lambdaHandler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    const requestId = context.requestId || 'local-' + Date.now();
    
    logger.info('Processing SSE request', {
      requestId,
      httpMethod: event.httpMethod || event.requestContext?.http?.method,
      path: event.path || event.requestContext?.http?.path,
    });
    
    // Set SSE headers
    const metadata = {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': config.cors.allowOrigin,
        'Access-Control-Allow-Methods': config.cors.allowMethods,
        'Access-Control-Allow-Headers': config.cors.allowHeaders,
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    };
    
    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
    
    try {
      // Handle CORS preflight
      const method = event.httpMethod || event.requestContext?.http?.method;
      if (method === 'OPTIONS') {
        logger.debug('Handling CORS preflight request', { requestId });
        responseStream.write('');
        responseStream.end();
        return;
      }
      
      // Stream events
      await streamMockEvents(responseStream, requestId);
      
    } catch (error) {
      logger.error('Error in lambda handler', {
        requestId,
        error: error.message,
        stack: error.stack,
      });
      
      // Try to send error
      try {
        const errorMsg = createError(`Server error: ${error.message}`);
        responseStream.write(errorMsg);
      } catch (writeError) {
        logger.error('Failed to write error to stream', { 
          requestId, 
          error: writeError.message 
        });
      }
      
      responseStream.end();
    }
  }
);

// For local testing without streaming (SAM local doesn't fully support streaming yet)
export const lambdaHandlerLocal = async (event, context) => {
  const requestId = context.requestId || 'local-' + Date.now();
  
  logger.info('Local test mode - generating sample events', { requestId });
  
  // Generate a few sample events for testing
  const events = [];
  for (let i = 0; i < 3; i++) {
    const mockEvent = {
      type: 'test_event',
      id: `evt_${Date.now()}_${i}`,
      timestamp: new Date().toISOString(),
      data: {
        message: `Test event ${i}`,
        eventNumber: i,
      },
    };
    events.push(mockEvent);
  }
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'SSE test response (local mode)',
      note: 'In production, this will stream SSE events. Local testing shows sample events.',
      sampleEvents: events,
      config: {
        eventInterval: config.sse.eventInterval,
        maxDuration: config.sse.maxStreamDuration,
      },
    }),
  };
};
```

---

### Step 8: Create Environment Configuration

**What to do:**
Create environment file for local testing.

**Create new file: `apps/services/sse-stream/env.json`**

```json
{
  "SSEStreamFunction": {
    "ENVIRONMENT": "local",
    "AWS_SAM_LOCAL": "true",
    "LOG_LEVEL": "debug",
    "DEBUG": "true",
    "SSE_USE_MOCK": "true",
    "SSE_EVENT_INTERVAL": "10000",
    "SSE_MAX_DURATION": "60000",
    "SSE_KEEPALIVE_INTERVAL": "15000",
    "CORS_ORIGIN": "*",
    "CORS_METHODS": "GET, OPTIONS",
    "CORS_HEADERS": "*",
    "CORS_MAX_AGE": "600"
  }
}
```

---

### Step 9: Create Test Event

**What to do:**
Create sample test event for local invocation.

**Create new file: `apps/services/sse-stream/events/test.json`**

```json
{
  "httpMethod": "GET",
  "path": "/stream",
  "headers": {
    "Accept": "text/event-stream"
  }
}
```

---

### Step 10: Update SAM Template

**What to do:**
Add the new SSE function to the SAM template.

**Update file: `apps/services/template.yaml`**

Add this new function definition:

```yaml
  SSEStreamFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: sse-stream/
      Handler: app.lambdaHandlerLocal
      Runtime: nodejs20.x
      Architectures:
        - x86_64
      Timeout: 300
      MemorySize: 512
      Environment:
        Variables:
          ENVIRONMENT: !Ref Environment
          LOG_LEVEL: info
          SSE_EVENT_INTERVAL: 10000
          SSE_MAX_DURATION: 300000
          SSE_KEEPALIVE_INTERVAL: 30000
      FunctionUrlConfig:
        AuthType: NONE
        InvokeMode: RESPONSE_STREAM
        Cors:
          AllowOrigins:
            - "*"
          AllowMethods:
            - GET
            - OPTIONS
          AllowHeaders:
            - "*"
          MaxAge: 600
      Events:
        HttpApiEvent:
          Type: HttpApi
          Properties:
            Path: /stream
            Method: GET
            TimeoutInMillis: 300000
            PayloadFormatVersion: "2.0"

Outputs:
  # ... existing outputs ...
  
  SSEStreamFunctionUrl:
    Description: "SSE Stream Lambda Function URL"
    Value: !GetAtt SSEStreamFunctionUrl.FunctionUrl
  
  SSEStreamFunction:
    Description: "SSE Stream Lambda Function ARN"
    Value: !GetAtt SSEStreamFunction.Arn
```

---

### Step 11: Create Test Script

**What to do:**
Create script for local testing.

**Create new file: `apps/services/sse-stream/test-local.sh`**

```bash
#!/bin/bash

# Local testing script for SSE Lambda function
# Usage: ./test-local.sh

echo "🧪 Testing SSE Lambda function locally..."
echo ""
echo "⚠️  Note: SAM local doesn't fully support response streaming yet."
echo "   This test will show sample events. Deploy to AWS for full SSE streaming."
echo ""

# Build the function
echo "🔨 Building Lambda function..."
cd .. && sam build && cd sse-stream || exit 1

# Invoke locally
echo "🚀 Invoking Lambda function..."
cd .. && sam local invoke SSEStreamFunction \
  --event sse-stream/events/test.json \
  --env-vars sse-stream/env.json

echo ""
echo "✅ Test completed!"
echo ""
echo "To test with real SSE streaming:"
echo "1. Deploy to AWS: sam deploy"
echo "2. Get the Function URL from outputs"
echo "3. Test with: curl -N <FUNCTION_URL>"
```

Make it executable:
```bash
chmod +x apps/services/sse-stream/test-local.sh
```

---

### Step 12: Create Documentation

**What to do:**
Create comprehensive documentation.

**Create new file: `apps/services/sse-stream/README.md`**

```markdown
# SSE Stream Lambda Function

Lambda function that streams Server-Sent Events (SSE) to clients for real-time updates. Currently sends mock events every 10 seconds to demonstrate SSE functionality.

## Features

- ✅ Server-Sent Events (SSE) streaming
- ✅ Lambda Response Streaming
- ✅ Mock event generator (10-second intervals)
- ✅ Keep-alive heartbeats
- ✅ Automatic connection management
- ✅ CORS support
- ✅ Structured logging
- ✅ Error handling

## Architecture

```
Client → API Gateway (HTTP API) → Lambda Function URL → SSE Stream
                                          ↓
                                    Event Generator
                                          ↓
                                  Send event every 10s
```

## SSE Protocol

The function sends events in standard SSE format:

```
event: policy_update
id: 1
data: {"type":"policy_update","id":"evt_123","timestamp":"2025-10-06T12:00:00Z","data":{"pet":"Whiskers","status":"approved"}}

event: heartbeat
data: {"status":"alive","timestamp":"2025-10-06T12:00:30Z"}
```

## Event Types

- `connected` - Connection established
- `policy_update` - Policy updated
- `claim_status` - Claim status changed
- `reminder` - Pet care reminder
- `notification` - General notification
- `alert` - Important alert
- `heartbeat` - Keep-alive message
- `goodbye` - Stream closing
- `error` - Error occurred

## Prerequisites

### For Local Development
- Node.js 20+
- AWS SAM CLI installed
- Docker running

### For AWS Deployment
- AWS account
- SAM CLI configured
- Appropriate IAM permissions

## Installation

```bash
cd apps/services/sse-stream
npm install
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SSE_EVENT_INTERVAL` | Interval between events (ms) | `10000` (10s) |
| `SSE_MAX_DURATION` | Max stream duration (ms) | `300000` (5min) |
| `SSE_KEEPALIVE_INTERVAL` | Keep-alive interval (ms) | `30000` (30s) |
| `SSE_USE_MOCK` | Use mock events | `true` |
| `LOG_LEVEL` | Logging level | `info` |

## Local Testing

### Quick Test

```bash
./test-local.sh
```

⚠️ **Note:** SAM local doesn't fully support Lambda Response Streaming yet. Local testing will return sample events as JSON. Deploy to AWS for full SSE streaming.

### Manual Testing

```bash
cd apps/services
sam build
sam local invoke SSEStreamFunction \
  --event sse-stream/events/test.json \
  --env-vars sse-stream/env.json
```

## AWS Deployment

### Deploy Function

```bash
cd apps/services

# Build
sam build

# Deploy
sam deploy

# Get Function URL from outputs
sam list stack-outputs --stack-name <your-stack-name>
```

### Test SSE Stream

```bash
# Using curl
curl -N <FUNCTION_URL>

# Using curl with verbose output
curl -N -v <FUNCTION_URL>
```

### Test with JavaScript

```javascript
const eventSource = new EventSource('YOUR_FUNCTION_URL');

eventSource.addEventListener('connected', (e) => {
  console.log('Connected:', JSON.parse(e.data));
});

eventSource.addEventListener('policy_update', (e) => {
  console.log('Policy update:', JSON.parse(e.data));
});

eventSource.addEventListener('heartbeat', (e) => {
  console.log('Heartbeat:', JSON.parse(e.data));
});

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  eventSource.close();
};
```

## Integration with Frontend

### React Example

```jsx
import { useEffect, useState } from 'react';

function SSEComponent() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('YOUR_FUNCTION_URL');

    eventSource.addEventListener('connected', () => {
      setConnected(true);
    });

    eventSource.addEventListener('policy_update', (e) => {
      const data = JSON.parse(e.data);
      setEvents(prev => [...prev, data]);
    });

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div>
      <div>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</div>
      <ul>
        {events.map((event, i) => (
          <li key={i}>{JSON.stringify(event)}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Vue Example

```vue
<template>
  <div>
    <div>Status: {{ connected ? '🟢 Connected' : '🔴 Disconnected' }}</div>
    <ul>
      <li v-for="(event, i) in events" :key="i">
        {{ event }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const events = ref([]);
const connected = ref(false);
let eventSource = null;

onMounted(() => {
  eventSource = new EventSource('YOUR_FUNCTION_URL');

  eventSource.addEventListener('connected', () => {
    connected.value = true;
  });

  eventSource.addEventListener('policy_update', (e) => {
    const data = JSON.parse(e.data);
    events.value.push(data);
  });

  eventSource.onerror = () => {
    connected.value = false;
    eventSource.close();
  };
});

onUnmounted(() => {
  if (eventSource) {
    eventSource.close();
  }
});
</script>
```

## API Reference

### Endpoint

`GET /stream`

### Headers

**Request:**
```
Accept: text/event-stream
```

**Response:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### SSE Message Format

Each event follows SSE protocol:

```
event: <event_type>
id: <event_id>
data: <json_payload>

```

## Monitoring

### CloudWatch Logs

```bash
# View logs
sam logs -n SSEStreamFunction --stack-name <stack-name> --tail

# Filter errors
sam logs -n SSEStreamFunction --stack-name <stack-name> --filter "ERROR"
```

### Metrics to Monitor

- Number of connections
- Event count per connection
- Stream duration
- Error rate
- Keep-alive success rate

## Troubleshooting

### Connection Closes Immediately

**Cause:** API Gateway or Lambda timeout
**Solution:** Increase timeout in template.yaml

### No Events Received

**Check:**
1. Function URL is correct
2. CORS headers are set
3. Client accepts `text/event-stream`
4. No proxy/CDN buffering

### Events Delayed

**Cause:** Buffering by proxy/CDN
**Solution:** Set `X-Accel-Buffering: no` header

## Cost Estimation

- **Lambda:** $0.20 per 1M requests + $0.0000166667 per GB-second
- **Data Transfer:** $0.09 per GB out to internet
- **Estimated:** ~$1-2 per 10K connections (5 min each)

## Security Considerations

- Enable authentication (API Gateway or Lambda Function URL)
- Validate client connections
- Rate limiting for connections
- Monitor for abuse
- Use AWS WAF if needed

## Future Enhancements

- [ ] Real-time events from DynamoDB Streams
- [ ] Events from EventBridge
- [ ] Client authentication
- [ ] Connection pooling
- [ ] Event filtering per client
- [ ] Compression support
- [ ] Metrics dashboard

## References

- [Lambda Response Streaming](https://docs.aws.amazon.com/lambda/latest/dg/configuration-response-streaming.html)
- [Server-Sent Events Spec](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
```

---

## Acceptance Criteria

- [ ] SSE Lambda function created
- [ ] Mock event generator working (10-second intervals)
- [ ] SSE protocol correctly implemented
- [ ] Keep-alive heartbeats sent
- [ ] Configuration module created
- [ ] Logger module created
- [ ] Local testing setup (with limitations noted)
- [ ] SAM template updated with Function URL
- [ ] Response streaming enabled
- [ ] CORS configured
- [ ] Error handling implemented
- [ ] Documentation complete
- [ ] Function deploys to AWS successfully
- [ ] SSE stream works in AWS
- [ ] Events received by client every 10 seconds
- [ ] Client can connect and receive events

---

## Testing Checklist

### Local Testing
1. [ ] `npm install` completes
2. [ ] `./test-local.sh` runs successfully
3. [ ] Sample events returned (JSON format)
4. [ ] Configuration loads correctly
5. [ ] Logs show event generation

### AWS Deployment
1. [ ] `sam build` completes
2. [ ] `sam deploy` succeeds
3. [ ] Function URL created
4. [ ] Function has correct timeout (300s)
5. [ ] InvokeMode set to RESPONSE_STREAM
6. [ ] CORS headers configured

### SSE Stream Testing
1. [ ] `curl -N <url>` receives SSE events
2. [ ] Connection message received first
3. [ ] Events arrive every 10 seconds
4. [ ] Heartbeats sent every 30 seconds
5. [ ] EventSource() works in browser
6. [ ] Events properly formatted
7. [ ] Stream closes after max duration
8. [ ] Goodbye message sent on close

### Frontend Integration
1. [ ] EventSource connects successfully
2. [ ] Events received and parsed
3. [ ] Connection status updates
4. [ ] Error handling works
5. [ ] Reconnection works after disconnect

---

## Important Notes

### Lambda Response Streaming Requirements

1. **Function URL or HTTP API**: Must use Lambda Function URL or API Gateway HTTP API (not REST API)
2. **InvokeMode**: Must be set to `RESPONSE_STREAM`
3. **Timeout**: Set appropriate timeout (up to 15 minutes)
4. **Handler**: Use `awslambda.streamifyResponse()` wrapper

### Local Testing Limitations

- SAM CLI has limited support for response streaming
- Local testing returns JSON instead of streaming
- Deploy to AWS for full SSE functionality
- Use local testing to verify logic only

### Browser Compatibility

- All modern browsers support EventSource
- No IE support (use polyfill if needed)
- Mobile browsers fully supported

### API Gateway Considerations

- HTTP API supports streaming (REST API doesn't)
- Maximum timeout: 30 seconds for API Gateway, 15 minutes for Function URL
- Use Function URL for longer streams

---

## Priority
High

## Estimated Time
4-6 hours

## Created
2025-10-06

## Assignee
AI Agent / Dmytro

## Labels
aws, lambda, sse, streaming, real-time, events, websocket-alternative

## Dependencies
- AWS SAM CLI installed
- Node.js 20+
- Docker for local testing
- AWS account for deployment

## Files to Create

1. `apps/services/sse-stream/app.mjs`
2. `apps/services/sse-stream/sseFormatter.mjs`
3. `apps/services/sse-stream/eventGenerator.mjs`
4. `apps/services/sse-stream/config.mjs`
5. `apps/services/sse-stream/logger.mjs`
6. `apps/services/sse-stream/package.json`
7. `apps/services/sse-stream/env.json`
8. `apps/services/sse-stream/events/test.json`
9. `apps/services/sse-stream/test-local.sh`
10. `apps/services/sse-stream/README.md`

## Files to Modify

1. `apps/services/template.yaml` - Add SSEStreamFunction

## External Resources

- [AWS Lambda Response Streaming](https://aws.amazon.com/blogs/compute/introducing-aws-lambda-response-streaming/)
- [Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [MDN EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [Lambda Function URLs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html)

---

## Success Criteria Summary

**Streaming:**
1. Lambda function streams SSE events
2. Events sent every 10 seconds
3. Keep-alive messages maintain connection
4. Stream closes gracefully

**Protocol:**
1. SSE format correctly implemented
2. Event types supported
3. IDs and timestamps included
4. Multi-line data handled

**Deployment:**
1. Function deploys to AWS
2. Function URL created
3. Response streaming enabled
4. CORS configured correctly

**Client:**
1. Browser EventSource connects
2. Events received and parsed
3. Error handling works
4. Reconnection supported

