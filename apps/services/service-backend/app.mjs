/**
 * Service Backend Lambda Function
 * 
 * Provides REST API endpoint to retrieve veterinary appointments data
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.VET_APPOINTMENTS_TABLE_NAME || 'VetAppointments';

/**
 * Lambda handler for getting vet appointments
 * 
 * @param {Object} event - API Gateway event object
 * @param {Object} context - Lambda context
 * @returns {Object} Response object with appointments data
 */
export const handler = async (event, context) => {
  const requestId = context.requestId || 'local-' + Date.now();
  
  console.log('Received request for vet appointments:', {
    requestId,
    method: event.httpMethod,
    path: event.path,
  });

  try {
    // Scan the VetAppointments table to get all appointments
    const command = new ScanCommand({
      TableName: tableName,
    });

    console.log('Scanning VetAppointments table', { 
      requestId,
      tableName,
    });

    const result = await docClient.send(command);
    const appointments = result.Items || [];

    console.log('Successfully retrieved appointments', { 
      requestId,
      count: appointments.length,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: JSON.stringify({
        success: true,
        count: appointments.length,
        data: appointments,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error retrieving appointments from DynamoDB', { 
      requestId,
      error: error.message,
      stack: error.stack,
      code: error.code,
    });
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
      body: JSON.stringify({ 
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve appointments',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      }),
    };
  }
};

