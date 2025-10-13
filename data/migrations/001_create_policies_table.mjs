/**
 * Migration: Create Policies Table in DynamoDB
 * 
 * This migration creates a DynamoDB table for storing pet insurance policies.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });

const TABLE_NAME = "Policies";

export async function up() {
  console.log(`Creating table: ${TABLE_NAME}...`);

  const params = {
    TableName: TABLE_NAME,
    AttributeDefinitions: [
      {
        AttributeName: "policyId",
        AttributeType: "S"
      },
      {
        AttributeName: "ownerId",
        AttributeType: "S"
      },
      {
        AttributeName: "status",
        AttributeType: "S"
      }
    ],
    KeySchema: [
      {
        AttributeName: "policyId",
        KeyType: "HASH"
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "OwnerIdIndex",
        KeySchema: [
          {
            AttributeName: "ownerId",
            KeyType: "HASH"
          }
        ],
        Projection: {
          ProjectionType: "ALL"
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: "StatusIndex",
        KeySchema: [
          {
            AttributeName: "status",
            KeyType: "HASH"
          }
        ],
        Projection: {
          ProjectionType: "ALL"
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    Tags: [
      {
        Key: "Project",
        Value: "Purrsurance"
      },
      {
        Key: "Environment",
        Value: process.env.ENVIRONMENT || "development"
      }
    ]
  };

  try {
    // Check if table already exists
    try {
      const describeCommand = new DescribeTableCommand({ TableName: TABLE_NAME });
      await client.send(describeCommand);
      console.log(`✓ Table ${TABLE_NAME} already exists`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // Create table
    const command = new CreateTableCommand(params);
    const response = await client.send(command);
    
    console.log(`✓ Table ${TABLE_NAME} created successfully`);
    console.log(`  ARN: ${response.TableDescription.TableArn}`);
    
    // Wait for table to be active
    console.log(`  Waiting for table to be active...`);
    let tableStatus = 'CREATING';
    while (tableStatus !== 'ACTIVE') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const describeCommand = new DescribeTableCommand({ TableName: TABLE_NAME });
      const describeResponse = await client.send(describeCommand);
      tableStatus = describeResponse.Table.TableStatus;
      console.log(`  Status: ${tableStatus}`);
    }
    
    console.log(`✓ Table ${TABLE_NAME} is now active`);
  } catch (error) {
    console.error(`✗ Failed to create table ${TABLE_NAME}:`, error.message);
    throw error;
  }
}

export async function down() {
  console.log(`Dropping table: ${TABLE_NAME}...`);
  console.log(`⚠ This operation is destructive and will delete all data!`);
  console.log(`✗ Skipping table deletion for safety. Please delete manually if needed.`);
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  up()
    .then(() => {
      console.log('\n✓ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Migration failed:', error);
      process.exit(1);
    });
}

