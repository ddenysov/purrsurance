#!/usr/bin/env node
/**
 * Test DynamoDB Connection
 * 
 * Verifies that AWS credentials are configured correctly
 * and can connect to DynamoDB
 */

import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

const region = process.env.AWS_REGION || 'us-east-1';

console.log('\n🔍 Testing DynamoDB Connection...\n');
console.log(`Region: ${region}`);
console.log(`Profile: ${process.env.AWS_PROFILE || 'default'}\n`);

const client = new DynamoDBClient({ region });

try {
  const command = new ListTablesCommand({});
  const response = await client.send(command);
  
  console.log('✓ Connection successful!\n');
  console.log(`Found ${response.TableNames.length} table(s):`);
  
  if (response.TableNames.length > 0) {
    response.TableNames.forEach(name => {
      const isPolicies = name === 'Policies';
      const marker = isPolicies ? '✓' : '-';
      console.log(`  ${marker} ${name}${isPolicies ? ' (Policies table)' : ''}`);
    });
  } else {
    console.log('  (no tables yet - run "make migrate" to create)');
  }
  
  console.log('\n✓ Ready to run migrations and seeds\n');
  process.exit(0);
} catch (error) {
  console.error('✗ Connection failed!\n');
  console.error(`Error: ${error.message}\n`);
  
  if (error.name === 'CredentialsProviderError') {
    console.error('💡 Tip: Configure AWS credentials:');
    console.error('   aws configure');
    console.error('   or');
    console.error('   export AWS_ACCESS_KEY_ID=...');
    console.error('   export AWS_SECRET_ACCESS_KEY=...');
  }
  
  console.error('');
  process.exit(1);
}

