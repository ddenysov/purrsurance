# @vet-expert/agent-tools

Shared utilities for AWS Bedrock Agent tools.

## Installation

```bash
pnpm add @vet-expert/agent-tools@file:../../../packages/agent-tools
```

## Usage

### Creating Agent Response

```javascript
import { createAgentResponse } from '@vet-expert/agent-tools';

export const lambdaHandler = async (event, context) => {
  const responseBodyContent = {
    message: 'Hello from agent',
    data: { /* your data */ }
  };

  return createAgentResponse(event, responseBodyContent);
};
```

### Extracting Session ID

```javascript
import { extractSessionId } from '@vet-expert/agent-tools';

export const lambdaHandler = async (event, context) => {
  const sessionId = extractSessionId(event);
  console.log('Session ID:', sessionId);
};
```

### Extracting Parameters

```javascript
import { extractParameters } from '@vet-expert/agent-tools';

export const lambdaHandler = async (event, context) => {
  const params = extractParameters(event);
  const location = params.location || 'default';
  const specialty = params.specialty || 'any';
};
```

### Sending Events to Event Publisher

```javascript
import { sendEventToPublisher, extractSessionId } from '@vet-expert/agent-tools';

const eventPublisherUrl = process.env.EVENT_PUBLISHER_URL;

export const lambdaHandler = async (event, context) => {
  const sessionId = extractSessionId(event);
  
  const responseData = {
    message: 'Action completed',
    data: { /* your data */ }
  };

  // Send event to Event Publisher (non-blocking)
  await sendEventToPublisher(
    eventPublisherUrl,
    sessionId,
    responseData,
    'ActionCompleted'
  );
  
  return responseData;
};
```

## API

### createAgentResponse(event, responseBodyContent)

Creates a standardized AWS Bedrock Agent function response.

**Parameters:**
- `event` (Object) - The event payload from the Bedrock Agent
- `responseBodyContent` (Object) - The content to return in the response body

**Returns:** Formatted response object for Bedrock Agent

### extractSessionId(event)

Extracts session ID from event with fallback logic.

**Parameters:**
- `event` (Object) - The event payload from the Bedrock Agent

**Returns:** Session ID (string)

### extractParameters(event)

Extracts parameters from event as a key-value object.

**Parameters:**
- `event` (Object) - The event payload from the Bedrock Agent

**Returns:** Parameters as key-value pairs (Object)

### sendEventToPublisher(eventPublisherUrl, sessionId, data, eventType)

Sends an event to the Event Publisher service for tracking and analytics.

**Parameters:**
- `eventPublisherUrl` (string) - URL of the Event Publisher service
- `sessionId` (string) - Session ID for event tracking
- `data` (Object) - Event data payload
- `eventType` (string) - Type of event (e.g., 'PolicyDetailsRetrieved', 'FindVetClinic')

**Returns:** Promise that resolves when event is sent (non-blocking, errors are logged but not thrown)

## License

MIT

