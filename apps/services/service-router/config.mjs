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
    // Intention Classifier Agent
    intentionClassifier: {
      agentId: process.env.INTENTION_CLASSIFIER_AGENT_ID,
      agentAliasId: process.env.INTENTION_CLASSIFIER_AGENT_ALIAS_ID || 'TSTALIASID',
    },
    // Policy Manager Agent
    policyManager: {
      agentId: process.env.POLICY_MANAGER_AGENT_ID,
      agentAliasId: process.env.POLICY_MANAGER_AGENT_ALIAS_ID || 'TSTALIASID',
    },
    // VetDoc Agent
    vetDoc: {
      agentId: process.env.VETDOC_AGENT_ID,
      agentAliasId: process.env.VETDOC_AGENT_ALIAS_ID || 'TSTALIASID',
    },
    // Booking Manager Agent
    bookingManager: {
      agentId: process.env.BOOKING_MANAGER_AGENT_ID,
      agentAliasId: process.env.BOOKING_MANAGER_AGENT_ALIAS_ID || 'TSTALIASID',
    },
    // Legacy support (for backward compatibility)
    agentId: process.env.BEDROCK_AGENT_ID,
    agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID || 'TSTALIASID',
    region: process.env.AWS_REGION || 'us-east-1',
    useMock: process.env.USE_MOCK_BEDROCK === 'true' || isLocal,
    sessionConfig: {
      enableTrace: process.env.ENABLE_TRACE === 'true' || false,
    },
  },
  
  // Agent routing mapping: maps classifier output to agent configuration
  agentMapping: {
    'PolicyAgent': 'policyManager',
    'VetDocAgent': 'vetDoc',
    'BookingAgent': 'bookingManager',
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
    // Check Intention Classifier Agent config
    if (!config.bedrock.intentionClassifier.agentId) {
      errors.push('INTENTION_CLASSIFIER_AGENT_ID is required');
    }
    if (!config.bedrock.intentionClassifier.agentAliasId) {
      errors.push('INTENTION_CLASSIFIER_AGENT_ALIAS_ID is required');
    }
    
    // Check Policy Manager Agent config
    if (!config.bedrock.policyManager.agentId) {
      errors.push('POLICY_MANAGER_AGENT_ID is required');
    }
    if (!config.bedrock.policyManager.agentAliasId) {
      errors.push('POLICY_MANAGER_AGENT_ALIAS_ID is required');
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Get agent configuration by classification name
 * @param {string} classification - Classification result from Intention Classifier
 * @returns {Object|null} Agent configuration object or null if not found
 */
export function getAgentConfig(classification) {
  const agentKey = config.agentMapping[classification];
  if (!agentKey) {
    return null;
  }
  
  const agentConfig = config.bedrock[agentKey];
  if (!agentConfig || !agentConfig.agentId) {
    return null;
  }
  
  return {
    agentId: agentConfig.agentId,
    agentAliasId: agentConfig.agentAliasId,
    name: classification,
  };
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
      intentionClassifier: {
        agentId: config.bedrock.intentionClassifier.agentId ? '***' + config.bedrock.intentionClassifier.agentId.slice(-4) : 'not set',
        agentAliasId: config.bedrock.intentionClassifier.agentAliasId,
      },
      policyManager: {
        agentId: config.bedrock.policyManager.agentId ? '***' + config.bedrock.policyManager.agentId.slice(-4) : 'not set',
        agentAliasId: config.bedrock.policyManager.agentAliasId,
      },
      vetDoc: {
        agentId: config.bedrock.vetDoc.agentId ? '***' + config.bedrock.vetDoc.agentId.slice(-4) : 'not set',
        agentAliasId: config.bedrock.vetDoc.agentAliasId,
      },
      bookingManager: {
        agentId: config.bedrock.bookingManager.agentId ? '***' + config.bedrock.bookingManager.agentId.slice(-4) : 'not set',
        agentAliasId: config.bedrock.bookingManager.agentAliasId,
      },
      region: config.bedrock.region,
      useMock: config.bedrock.useMock,
      enableTrace: config.bedrock.sessionConfig.enableTrace,
    },
    agentMapping: config.agentMapping,
    dynamodb: {
      chatHistoryTable: config.dynamodb.chatHistoryTable,
    },
    cors: config.cors,
    logging: config.logging,
  };
}

