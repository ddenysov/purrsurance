# Chat History Persistence

## Overview

Chat messages are automatically saved to DynamoDB with session-based isolation. Each conversation is associated with a `globalSessionId`, ensuring privacy and multi-session support.

## Architecture

### Data Flow

```
User Message → Backend Lambda → Save to DB
                      ↓
              Bedrock Agent
                      ↓
           Assistant Response → Save to DB
```

### DynamoDB Schema

**Table**: `ChatHistoryTable`

**Keys**:
- Partition Key: `sessionId` (String)
- Sort Key: `timestamp` (Number)

**Attributes**:
- `messageId` - Unique identifier
- `sender` - "user" or "assistant"
- `content` - Message text
- `bedrockSessionId` - Bedrock session ID
- `metadata` - Additional metadata
- `ttl` - Auto-deletion timestamp (90 days)

## Features

### 1. Automatic Saving

Messages are saved automatically during the chat flow:
- User messages saved before Bedrock invocation
- Assistant responses saved after Bedrock response
- No frontend changes required

### 2. Session Isolation

Each session has isolated chat history:
- Uses existing `globalSessionId` from frontend
- Perfect isolation between browser windows/tabs
- Privacy-compliant

### 3. TTL (Time To Live)

Messages auto-delete after 90 days:
- Complies with data retention policies
- Reduces storage costs
- Can be adjusted in `chatHistoryService.mjs`

### 4. Error Handling

Graceful error handling:
- Chat continues even if saving fails
- Errors logged but not returned to user
- No impact on user experience

## API Reference

### Save Message (Internal)

```javascript
import { saveChatMessage } from './chatHistoryService.mjs';

await saveChatMessage({
  sessionId: 'abc-123',
  sender: 'user',
  content: 'Hello',
  bedrockSessionId: 'bedrock-session-id',
  metadata: {
    requestId: 'req-123',
    environment: 'prod',
  }
});
```

### Get History (Optional Endpoint)

```bash
GET /chat-history?sessionId=abc-123&limit=100
```

**Response:**
```json
{
  "message": "Success",
  "data": {
    "sessionId": "abc-123",
    "messages": [
      {
        "sessionId": "abc-123",
        "timestamp": 1696606800000,
        "messageId": "msg-123",
        "sender": "user",
        "content": "Hello",
        "bedrockSessionId": "bedrock-session-id"
      }
    ],
    "count": 1
  }
}
```

## Configuration

### Environment Variables

- `CHAT_HISTORY_TABLE_NAME` - DynamoDB table name

### TTL Configuration

Edit in `chatHistoryService.mjs`:

```javascript
// Current: 90 days
const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60);

// Change to 30 days:
const ttl = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
```

## Monitoring

### CloudWatch Metrics

Monitor these metrics:
- Number of messages saved per hour
- Save operation success rate
- DynamoDB read/write capacity
- Error rate

### CloudWatch Logs

Search for:
- `"Chat message saved to DynamoDB"` - Successful saves
- `"Failed to save chat message"` - Save errors

## Cost Estimation

**DynamoDB**:
- Write Capacity: ~2 WCU per message exchange (user + assistant)
- Storage: ~1 KB per message average
- TTL: No additional cost for automatic deletion

**Estimated Cost**:
- 10,000 message exchanges/month: ~$1-2/month
- Includes storage and automatic TTL cleanup

## Security

### Data Privacy

- Messages isolated by session ID
- No cross-session access possible
- TTL ensures automatic cleanup

### Access Control

- Lambda has minimal IAM permissions
- Only write access to ChatHistoryTable
- No public access to table

## Testing

### Local Testing

```bash
cd apps/services/hello-world
./test-chat-history.sh
```

### Manual Testing

1. Send chat message with `globalSessionId`
2. Check DynamoDB table for saved messages
3. Verify both user and assistant messages saved
4. Check timestamps are correct

### Verification

```bash
# Query DynamoDB
aws dynamodb query \
  --table-name ChatHistoryTable \
  --key-condition-expression "sessionId = :sid" \
  --expression-attribute-values '{":sid":{"S":"your-session-id"}}'
```

## Troubleshooting

### Messages Not Saving

1. Check CloudWatch logs for errors
2. Verify `CHAT_HISTORY_TABLE_NAME` environment variable
3. Check IAM permissions for Lambda
4. Verify `globalSessionId` is being sent from frontend

### DynamoDB Errors

1. Check table exists: `aws dynamodb describe-table --table-name ChatHistoryTable`
2. Verify Lambda has write permissions
3. Check table capacity mode (should be PAY_PER_REQUEST)

## Future Enhancements

- [ ] Conversation export feature
- [ ] Search across conversations
- [ ] Analytics dashboard
- [ ] Message editing/deletion
- [ ] Conversation sharing
- [ ] Multi-device sync
