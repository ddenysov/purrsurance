# Session Isolation for SSE Events

## Overview

This document describes the implementation of session-based isolation for Server-Sent Events (SSE) in the Purrsurance application. Each browser window/tab now has its own unique session and receives only events specific to that session.

## Architecture Changes

### 1. Frontend Changes

#### New Composable: `useSession.ts`
- Generates a unique session ID for each browser window/tab
- Uses `crypto.randomUUID()` for secure ID generation
- Session ID is stored at module level (not in localStorage) to ensure isolation per window/tab
- Location: `apps/chat/app/composables/useSession.ts`

#### Updated Components
- **`index.vue`**: 
  - Now uses `useSession()` to get unique session ID
  - Appends `sessionId` as query parameter to SSE URL
  - Example: `https://.../stream?sessionId=abc-123-def`

- **`useChat.ts`**:
  - Imports and uses `useSession()` to get global session ID
  - Passes `globalSessionId` to backend API calls
  - Maintains separate Bedrock session ID for conversation continuity

- **`chatService.ts`**:
  - Updated to accept both `bedrockSessionId` and `globalSessionId` parameters
  - Sends `globalSessionId` in API payload for event routing

### 2. Backend Lambda Changes

#### SSE Stream Lambda (`sse-stream/app.mjs`)
- **Query Parameter Handling**:
  - Extracts `sessionId` from query parameters
  - Validates presence of `sessionId` (returns 400 if missing)
  - Uses `sessionId` as DynamoDB partition key for querying

- **DynamoDB Query**:
  - Changed from fixed partition key `'EVENTS'` to dynamic `sessionId`
  - Only retrieves events specific to the requesting session

- **Configuration** (`config.mjs`):
  - Removed hardcoded `partitionKey` from config
  - Now uses session-specific partition keys

#### Event Saver Lambda (`saver/app.mjs`)
- **SNS Message Processing**:
  - Extracts `sessionId` from SNS message attributes
  - Validates presence of `sessionId` (skips events without it)
  - Uses `sessionId` as partition key when saving to DynamoDB

- **DynamoDB Storage**:
  - Events are now partitioned by session ID
  - Schema: `partitionKey: sessionId, sortKey: timestamp`

#### Event Producer Lambda (`producer/app.mjs`)
- **Request Handling**:
  - Accepts `sessionId` in request body or `X-Session-Id` header
  - Validates presence of `sessionId` (returns 400 if missing)
  - Adds `sessionId` to SNS message attributes

#### Bedrock Agent Integration

**Hello World Lambda** (`hello-world/app.mjs`):
- Accepts `globalSessionId` from API request payload
- Passes it to Bedrock Agent via session attributes

**Bedrock Client** (`hello-world/bedrockClient.mjs`):
- Updated `invokeBedrockAgent()` to accept `globalSessionId` parameter
- Adds session attributes to Bedrock Agent command:
  ```javascript
  sessionState: {
    sessionAttributes: {
      sessionId: globalSessionId
    }
  }
  ```

**Get Policy Details Lambda** (`get-policy-details/app.mjs`):
- Extracts `sessionId` from Bedrock Agent event:
  - First checks `event.sessionAttributes.sessionId`
  - Falls back to `parameters` if not in session attributes
- Adds `sessionId` to SNS message attributes when publishing events
- Only publishes events if `sessionId` is present (maintains isolation)

## Event Flow

### 1. Client Initialization
```
Browser Window Opens
  ↓
useSession() generates unique sessionId
  ↓
SSE connection established with sessionId in URL
  ↓
SSE Lambda validates sessionId and starts streaming
```

### 2. Event Publishing Flow
```
User sends chat message with globalSessionId
  ↓
Bedrock Agent receives sessionId in sessionAttributes
  ↓
Lambda function (e.g., get-policy-details) extracts sessionId
  ↓
Event published to SNS with sessionId in message attributes
  ↓
Saver Lambda extracts sessionId and saves to DynamoDB with sessionId as partitionKey
  ↓
SSE Lambda polls DynamoDB using sessionId as partition key
  ↓
Event delivered only to client with matching sessionId
```

## DynamoDB Schema

### Table: EventsTable

**Primary Key Structure:**
- **Partition Key**: `partitionKey` (String) - Contains session ID
- **Sort Key**: `timestamp` (Number) - Event timestamp in milliseconds

**Attributes:**
- `partitionKey`: Session ID (e.g., "abc-123-def-456")
- `timestamp`: Unix timestamp in milliseconds
- `payload`: Event data (JSON)
- `eventType`: Type of event (e.g., "policy_updated", "claim_status")
- `messageId`: SNS message ID

**Query Pattern:**
```javascript
KeyConditionExpression: 'partitionKey = :sessionId AND timestamp > :lastTimestamp'
```

## Session Isolation Benefits

1. **Privacy**: Events are only visible to the session that triggered them
2. **Multi-Tab Support**: Each browser tab has independent event stream
3. **Scalability**: DynamoDB partitioning by session ID improves read performance
4. **Security**: No cross-session event leakage
5. **Clean Separation**: Easy to track and debug session-specific events

## Testing

### Testing Session Isolation

1. Open two browser windows
2. Each window will have different session ID (check console logs)
3. Perform action in Window 1 (e.g., request policy details)
4. Verify that:
   - Window 1 receives the event
   - Window 2 does NOT receive the event

### Checking Session ID

**Frontend Console:**
```javascript
// Session initialization
[Session] Generated new session ID: abc-123-def-456

// SSE connection
[SSE] Connecting with session ID: abc-123-def-456
```

**Backend Logs:**
```javascript
// SSE Lambda
Processing SSE request { sessionId: 'abc-123-def-456' }

// Saver Lambda
Successfully saved event to DynamoDB { sessionId: 'abc-123-def-456' }
```

## Migration Notes

### Breaking Changes

1. **SSE URL**: Now requires `sessionId` query parameter
2. **Event Producer API**: Now requires `sessionId` in body or header
3. **DynamoDB Data**: Old events with `partitionKey: 'EVENTS'` will not be accessible

### Backward Compatibility

The implementation includes validation and warnings:
- SSE Lambda returns 400 if `sessionId` is missing
- Saver Lambda skips events without `sessionId` (with warning)
- Producer Lambda requires `sessionId` for all new events

### Data Migration

Old events in DynamoDB with `partitionKey: 'EVENTS'` are not migrated. Consider:
1. Creating a new table for session-isolated events
2. Running a one-time migration script if old events are needed
3. Or simply start fresh with new session-based architecture

## Environment Variables

No new environment variables are required. The implementation uses existing infrastructure.

## Troubleshooting

### Events Not Appearing

1. Check sessionId in browser console
2. Verify SSE connection logs show correct sessionId
3. Check DynamoDB for events with matching partition key
4. Verify SNS message attributes include sessionId

### Multiple Sessions Receiving Same Event

1. Verify each browser window has unique sessionId
2. Check that Saver Lambda is using sessionId as partition key
3. Verify SSE Lambda is querying with correct sessionId

## Future Enhancements

1. **Session Persistence**: Option to save sessionId in localStorage for same-window persistence
2. **Session Sharing**: Allow multiple tabs to share same session (optional)
3. **Session Cleanup**: Automatic cleanup of old session data from DynamoDB
4. **Session Analytics**: Track session duration and event counts
5. **Session Recovery**: Ability to resume session after page reload

## Conclusion

Session isolation ensures that each browser window has its own private event stream, improving privacy, security, and multi-tab support. The implementation is seamless and requires no additional infrastructure.

