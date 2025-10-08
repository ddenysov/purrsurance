import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.EVENTS_TABLE_NAME;

export const handler = async (event) => {
  console.log('Received event from SNS:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const snsMessage = record.Sns;
    const messageContent = snsMessage.Message;

    try {
      // Extract sessionId from message attributes
      const sessionId = snsMessage.MessageAttributes?.sessionId?.Value;
      
      // Validate sessionId
      if (!sessionId) {
        console.warn('Missing sessionId in SNS message, skipping event:', {
          messageId: snsMessage.MessageId,
          eventType: snsMessage.MessageAttributes?.eventType?.Value,
        });
        continue;
      }
      
      const item = {
        partitionKey: sessionId, // Use sessionId as partition key for session isolation
        timestamp: Date.now(),    // Time in milliseconds for sorting
        payload: JSON.parse(messageContent), // Message content
        eventType: snsMessage.MessageAttributes?.eventType?.Value || 'Unknown',
        messageId: snsMessage.MessageId,
      };

      const command = new PutCommand({
        TableName: tableName,
        Item: item,
      });

      await docClient.send(command);
      console.log('Successfully saved event to DynamoDB:', {
        sessionId,
        eventType: item.eventType,
        messageId: item.messageId,
        timestamp: item.timestamp,
      });

    } catch (error) {
      console.error('Error parsing or saving message:', error);
      // If one message fails, continue processing others
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify('Processing complete.'),
  };
};

