# Event Saver Lambda Function

This Lambda function subscribes to SNS topic events and saves them to DynamoDB.

## Functionality

- Receives events from SNS topic
- Parses message content
- Stores events in DynamoDB with:
  - `partitionKey`: 'EVENTS' (for easy querying)
  - `timestamp`: Event timestamp in milliseconds
  - `payload`: Parsed message content
  - `eventType`: Event type from message attributes
  - `messageId`: SNS message ID

## Environment Variables

- `EVENTS_TABLE_NAME` - DynamoDB table name for storing events

## Event Flow

1. SNS publishes an event to the topic
2. Lambda function is triggered automatically
3. Function parses the SNS message
4. Function saves the event to DynamoDB
5. Returns success response

## Testing Locally

To test the function locally, use the provided test event:

```bash
./test-local.sh
```

## Dependencies

- `@aws-sdk/client-dynamodb` - DynamoDB client
- `@aws-sdk/lib-dynamodb` - DynamoDB document client for easier data manipulation

