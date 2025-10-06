# SSE Stream Changelog

## [2.0.0] - 2025-10-06

### Changed - DynamoDB Polling Implementation

#### Overview
Replaced mock event generation with real-time DynamoDB polling for streaming events to clients via SSE.

#### Key Changes

1. **Removed Mock Data**
   - Removed `eventGenerator.mjs` dependency
   - Removed `mockEventStream()` function calls
   - No more simulated events

2. **Added DynamoDB Integration**
   - Added `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb` dependencies
   - Implemented `queryNewEvents()` function to poll DynamoDB
   - Query events using partition key `'EVENTS'` and timestamp range

3. **Updated Stream Logic**
   - Renamed `streamMockEvents()` to `streamDynamoDBEvents()`
   - Implemented polling loop with configurable interval (default 5s)
   - Track last processed timestamp to avoid duplicates
   - Only send events that are newer than last seen

4. **Configuration Updates**
   - Added `EVENTS_TABLE_NAME` environment variable
   - Renamed `eventInterval` to `pollInterval` in config
   - Added `dynamodb.tableName` and `dynamodb.partitionKey` to config
   - Removed `SSE_USE_MOCK` flag

5. **Local Testing**
   - Updated local handler to query DynamoDB instead of generating mock events
   - Shows connection status and recent events count

#### How It Works

```
1. Client connects → Lambda function starts
2. Function sends "connected" SSE message
3. Polling loop begins:
   - Query DynamoDB for events with timestamp > lastTimestamp
   - If new events found:
     * Format each as SSE message
     * Send to client
     * Update lastTimestamp
   - Wait pollInterval (5s)
   - Repeat until max duration (5min) or disconnect
4. Send "goodbye" message and close connection
```

#### DynamoDB Query

```javascript
{
  TableName: 'EventsTable',
  KeyConditionExpression: 'partitionKey = :pk AND #ts > :lastTs',
  ExpressionAttributeValues: {
    ':pk': 'EVENTS',
    ':lastTs': lastSeenTimestamp
  }
}
```

#### Event Flow

```
Event Producer → SNS Topic → Event Saver → DynamoDB
                                              ↓
Client ← SSE Stream ← Lambda (polling) ← DynamoDB
```

#### Performance Considerations

- **Polling Interval:** 5 seconds (configurable)
- **Max Latency:** Up to 5 seconds for new events
- **DynamoDB Reads:** 1 query per 5 seconds per connection
- **Cost:** Minimal due to query efficiency (single partition key)

#### Future Improvements

- Use DynamoDB Streams for instant push (no polling delay)
- Implement client-specific event filtering
- Add support for multiple partition keys for better scalability
- Consider connection pooling for high-traffic scenarios

#### Breaking Changes

- Removed `SSE_USE_MOCK` environment variable
- Requires `EVENTS_TABLE_NAME` environment variable
- Requires DynamoDB read permissions

#### Migration Notes

If you're upgrading from v1.x:

1. Update SAM template to add DynamoDB permissions
2. Set `EVENTS_TABLE_NAME` environment variable
3. Remove `SSE_USE_MOCK` from environment variables
4. Redeploy the function
5. Test with real events using the producer function

#### Files Modified

- `app.mjs` - Complete rewrite of streaming logic
- `config.mjs` - Added DynamoDB configuration
- `package.json` - Added AWS SDK dependencies
- `README.md` - Updated documentation

#### Dependencies Added

```json
{
  "@aws-sdk/client-dynamodb": "^3.504.0",
  "@aws-sdk/lib-dynamodb": "^3.504.0"
}
```

