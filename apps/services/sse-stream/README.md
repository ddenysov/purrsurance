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


