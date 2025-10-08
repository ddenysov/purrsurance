/**
 * Configuration for different environments
 * Supports local development, dev, and production environments
 */

export const config = {
  // Environment detection
  environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'local',
  isLocal: process.env.AWS_SAM_LOCAL === 'true',
  
  // AWS Bedrock Agent configuration
  bedrock: {
    // Agent ID from AWS Bedrock Agents
    agentId: process.env.BEDROCK_AGENT_ID || '',
    
    // Agent Alias ID (use TSTALIASID for testing, or specific alias)
    agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID',
    
    // AWS Region
    region: process.env.AWS_REGION || 'us-east-1',
    
    // Session configuration
    sessionConfig: {
      // Enable session state tracking
      enableTrace: process.env.ENABLE_BEDROCK_TRACE === 'true',
      
      // Max tokens for response
      maxTokens: parseInt(process.env.MAX_TOKENS || '2048', 10),
    },
    
    // Local mock configuration
    useMock: process.env.USE_BEDROCK_MOCK === 'true',
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableDebug: process.env.DEBUG === 'true',
  },
  
  // CORS configuration
  cors: {
    allowOrigin: process.env.CORS_ORIGIN || '*',
    allowMethods: process.env.CORS_METHODS || '*',
    allowHeaders: process.env.CORS_HEADERS || '*',
    maxAge: parseInt(process.env.CORS_MAX_AGE || '600', 10),
  },
};

/**
 * Validate required configuration
 * @throws {Error} if required config is missing
 */
export function validateConfig() {
  const errors = [];
  
  if (!config.bedrock.useMock && !config.bedrock.agentId) {
    errors.push('BEDROCK_AGENT_ID is required when not using mock');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n- ${errors.join('\n- ')}`);
  }
}

/**
 * Get printable config (without sensitive data)
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
    },
    logging: config.logging,
  };
}

