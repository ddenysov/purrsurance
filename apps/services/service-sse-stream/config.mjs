/**
 * Configuration for SSE Lambda function
 * Supports local development and production environments
 */

export const config = {
  // Environment detection
  environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'local',
  isLocal: process.env.AWS_SAM_LOCAL === 'true',
  
  // SSE Configuration
  sse: {
    // Interval between DynamoDB polls (milliseconds)
    pollInterval: parseInt(process.env.SSE_POLL_INTERVAL || '2000', 10),
    
    // Maximum stream duration (milliseconds)
    maxStreamDuration: parseInt(process.env.SSE_MAX_DURATION || '300000', 10), // 5 minutes
    
    // Keep-alive interval (milliseconds)
    keepAliveInterval: parseInt(process.env.SSE_KEEPALIVE_INTERVAL || '30000', 10),
  },
  
  // DynamoDB Configuration
  dynamodb: {
    tableName: process.env.EVENTS_TABLE_NAME || 'vet-expert-event-publisher-events',
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableDebug: process.env.DEBUG === 'true',
  },
  
  // CORS configuration
  cors: {
    allowOrigin: process.env.CORS_ORIGIN || '*',
    allowMethods: process.env.CORS_METHODS || 'GET, OPTIONS',
    allowHeaders: process.env.CORS_HEADERS || '*',
    maxAge: parseInt(process.env.CORS_MAX_AGE || '600', 10),
  },
};

/**
 * Get printable config (without sensitive data)
 */
export function getPrintableConfig() {
  return {
    environment: config.environment,
    isLocal: config.isLocal,
    sse: config.sse,
    dynamodb: {
      tableName: config.dynamodb.tableName,
    },
    logging: config.logging,
  };
}

