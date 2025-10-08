/**
 * Configuration for Service Router Lambda Function
 * 
 * Centralizes all configuration settings from environment variables
 */

// Environment detection
export const isLocal = process.env.AWS_SAM_LOCAL === 'true' || 
                       process.env.IS_LOCAL === 'true' ||
                       !process.env.AWS_REGION;

// Configuration object
export const config = {
  // Environment
  environment: process.env.ENVIRONMENT || 'prod',
  isLocal,
  
  // AWS Bedrock Agent configuration
  bedrock: {
    agentId: process.env.BEDROCK_AGENT_ID,
    agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID',
    region: process.env.AWS_REGION || 'us-east-1',
    useMock: process.env.USE_MOCK_BEDROCK === 'true' || isLocal,
    sessionConfig: {
      enableTrace: process.env.ENABLE_TRACE === 'true' || false,
    },
  },
  
  // DynamoDB configuration
  dynamodb: {
    chatHistoryTable: process.env.CHAT_HISTORY_TABLE_NAME || 'ChatHistory',
  },
  
  // CORS configuration
  cors: {
    allowOrigin: process.env.CORS_ALLOW_ORIGIN || '*',
    allowMethods: process.env.CORS_ALLOW_METHODS || 'GET,POST,OPTIONS',
    allowHeaders: process.env.CORS_ALLOW_HEADERS || 'Content-Type,Authorization',
    maxAge: parseInt(process.env.CORS_MAX_AGE || '86400', 10),
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

/**
 * Validate required configuration
 * Throws error if critical config is missing
 */
export function validateConfig() {
  const errors = [];
  
  // In non-local/non-mock mode, Bedrock config is required
  if (!config.isLocal && !config.bedrock.useMock) {
    if (!config.bedrock.agentId) {
      errors.push('BEDROCK_AGENT_ID is required');
    }
    if (!config.bedrock.agentAliasId) {
      errors.push('BEDROCK_AGENT_ALIAS_ID is required');
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Get printable config (without sensitive data)
 * @returns {Object} Safe config object for logging
 */
export function getPrintableConfig() {
  return {
    environment: config.environment,
    isLocal: config.isLocal,
    bedrock: {
      agentId: config.bedrock.agentId ? '***' + config.bedrock.agentId.slice(-4) : 'not set',
      agentAliasId: config.bedrock.agentAliasId,
      region: config.bedrock.region,
      useMock: config.bedrock.useMock,
      enableTrace: config.bedrock.sessionConfig.enableTrace,
    },
    dynamodb: {
      chatHistoryTable: config.dynamodb.chatHistoryTable,
    },
    cors: config.cors,
    logging: config.logging,
  };
}

