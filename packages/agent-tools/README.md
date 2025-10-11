# @purrsurance/agent-tools

Shared utilities for AWS Bedrock Agent tools.

## Installation

```bash
pnpm add @purrsurance/agent-tools@file:../../../packages/agent-tools
```

## Usage

### Creating Agent Response

```javascript
import { createAgentResponse } from '@purrsurance/agent-tools';

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
import { extractSessionId } from '@purrsurance/agent-tools';

export const lambdaHandler = async (event, context) => {
  const sessionId = extractSessionId(event);
  console.log('Session ID:', sessionId);
};
```

### Extracting Parameters

```javascript
import { extractParameters } from '@purrsurance/agent-tools';

export const lambdaHandler = async (event, context) => {
  const params = extractParameters(event);
  const location = params.location || 'default';
  const specialty = params.specialty || 'any';
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

## License

MIT

