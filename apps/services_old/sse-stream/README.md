# SSE Stream Lambda Function

Lambda function that streams Server-Sent Events (SSE) to clients for real-time updates. Polls DynamoDB for new events and streams them to connected clients.

## Features

- ✅ Server-Sent Events (SSE) streaming
- ✅ Lambda Response Streaming
- ✅ DynamoDB polling for real-time events
- ✅ Keep-alive heartbeats
- ✅ Automatic connection management
- ✅ CORS support
- ✅ Structured logging
- ✅ Error handling

## Architecture

```
Client → API Gateway (HTTP API) → Lambda Function URL → SSE Stream
                                          ↓
                                   Poll DynamoDB
                                          ↓
                                    EventsTable
                                          ↑
                              SNS Topic → Event Saver
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
| `EVENTS_TABLE_NAME` | DynamoDB table name | `EventsTable` |
| `SSE_EVENT_INTERVAL` | Interval between DynamoDB polls (ms) | `5000` (5s) |
| `SSE_MAX_DURATION` | Max stream duration (ms) | `300000` (5min) |
| `SSE_KEEPALIVE_INTERVAL` | Keep-alive interval (ms) | `30000` (30s) |
| `LOG_LEVEL` | Logging level | `info` |
| `ENVIRONMENT` | Environment name | `local` |

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

## How It Works

1. **Client connects** to the SSE endpoint via HTTP API or Function URL
2. **Lambda function** initializes connection and sends `connected` event
3. **Polling loop** queries DynamoDB every 5 seconds for new events (events with timestamp > last seen)
4. **New events** are formatted as SSE messages and streamed to client
5. **Heartbeat messages** sent every 30 seconds to keep connection alive
6. **Connection closes** after 5 minutes (configurable) or on client disconnect

### DynamoDB Schema

The function queries the `EventsTable` with the following structure:

- **Partition Key:** `partitionKey` (String) - Fixed value `'EVENTS'`
- **Sort Key:** `timestamp` (Number) - Event timestamp in milliseconds
- **Attributes:**
  - `payload` - Event data (object)
  - `eventType` - Type of event (string)
  - `messageId` - Unique message ID (string)

## Future Enhancements

- [ ] DynamoDB Streams for instant push (no polling delay)
- [ ] Events from EventBridge
- [ ] Client authentication
- [ ] Connection pooling
- [ ] Event filtering per client
- [ ] Compression support
- [ ] Metrics dashboard
- [ ] Multiple partition keys for better scalability

## References

- [Lambda Response Streaming](https://docs.aws.amazon.com/lambda/latest/dg/configuration-response-streaming.html)
- [Server-Sent Events Spec](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)


