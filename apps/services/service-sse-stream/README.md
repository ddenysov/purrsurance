# Service SSE Stream

Lambda function with Server-Sent Events (SSE) streaming that reads real-time events from DynamoDB.

## Overview

This service provides real-time event streaming to clients using Server-Sent Events (SSE) protocol. It polls DynamoDB for new events and streams them to connected clients.

## Architecture

- **Lambda Function URL** with Response Streaming enabled
- **DynamoDB Query** - Polls for new events by sessionId and timestamp
- **SSE Protocol** - Streams events with proper formatting
- **Session Isolation** - Each client receives only their session's events

## Features

- ✅ Real-time event streaming via SSE
- ✅ Session-based event filtering
- ✅ Automatic heartbeat/keep-alive messages
- ✅ Configurable polling intervals
- ✅ Maximum stream duration limits
- ✅ CORS support for browser clients
- ✅ Structured JSON logging

## Configuration

Environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Environment name | `prod` |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | `info` |
| `EVENTS_TABLE_NAME` | DynamoDB table name for events | Imported from event-publisher |
| `SSE_POLL_INTERVAL` | Interval between DynamoDB polls (ms) | `2000` |
| `SSE_MAX_DURATION` | Maximum stream duration (ms) | `300000` (5 min) |
| `SSE_KEEPALIVE_INTERVAL` | Heartbeat interval (ms) | `30000` |

## Dependencies

This service depends on:
- **service-event-publisher** - Provides the DynamoDB table with events

## Usage

### Install Dependencies

```bash
make install
# or
pnpm install
```

### Build

```bash
make build
```

### Deploy

```bash
make deploy
```

This will:
1. Build the Lambda function
2. Package it with SAM
3. Deploy to AWS with CloudFormation

### Connect to Stream

After deployment, use the Function URL from outputs:

```bash
curl -N "https://<function-url>?sessionId=<your-session-id>"
```

Or from JavaScript:

```javascript
const eventSource = new EventSource(
  'https://<function-url>?sessionId=<your-session-id>'
);

eventSource.addEventListener('connected', (e) => {
  console.log('Connected:', JSON.parse(e.data));
});

eventSource.addEventListener('message', (e) => {
  console.log('Event:', JSON.parse(e.data));
});

eventSource.addEventListener('heartbeat', (e) => {
  console.log('Heartbeat:', JSON.parse(e.data));
});

eventSource.addEventListener('error', (e) => {
  console.error('Error:', e);
});

eventSource.addEventListener('goodbye', (e) => {
  console.log('Stream closing:', JSON.parse(e.data));
  eventSource.close();
});
```

## Event Format

Events are streamed in SSE format:

```
event: message
id: 1
data: {"type":"PolicyUpdate","id":"req-123","timestamp":1234567890,"payload":{...}}

event: heartbeat
data: {"status":"alive","timestamp":"2024-01-01T00:00:00.000Z"}
```

## DynamoDB Schema

The service reads from the events table created by `service-event-publisher`:

```
Table: <stack-name>-events
- partitionKey (S) - sessionId (HASH key)
- timestamp (N) - Unix timestamp in milliseconds (RANGE key)
- payload (MAP) - Event data
- eventType (S) - Type of event
- requestId (S) - Request identifier
```

## How It Works

1. Client connects with `sessionId` query parameter
2. Lambda sends "connected" event
3. Lambda polls DynamoDB every `SSE_POLL_INTERVAL` ms
4. New events are formatted as SSE and sent to client
5. Heartbeat messages keep connection alive
6. Stream closes after `SSE_MAX_DURATION` or on error
7. Lambda sends "goodbye" event before closing

## Local Testing

Note: SAM Local doesn't fully support response streaming yet.

```bash
sam local invoke SSEStreamFunction --env-vars env.json
```

This will test DynamoDB connectivity and show sample data.

## Monitoring

View logs:

```bash
make logs
# or
sam logs --stack-name vet-expert-sse-stream --tail
```

## Outputs

After deployment, the stack exports:

- **SSEStreamFunctionUrl** - Lambda Function URL for SSE streaming
- **SSEStreamFunction** - Lambda Function ARN
- **SSEStreamFunctionIamRole** - IAM Role ARN

## Cleanup

```bash
make clean
# or
rm -rf .aws-sam node_modules
```

## Notes

- Maximum Lambda execution time is 5 minutes (configurable)
- Clients should reconnect after stream closes
- Events are ephemeral - only new events since connection are sent
- Historical events from the last minute are included on connection

