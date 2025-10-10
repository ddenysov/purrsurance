/**
 * Simple structured logger
 * Supports different log levels and structured data
 */

import { config } from './config.mjs';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = LOG_LEVELS[config.logging.level] || LOG_LEVELS.info;

/**
 * Format log message
 */
function formatLog(level, message, data = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...data,
  };
  
  // In AWS Lambda, logs are automatically captured by CloudWatch
  return JSON.stringify(logEntry);
}

/**
 * Create log entry object
 */
function createLogEntry(level, message, data = {}) {
  return {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...data,
  };
}

/**
 * Log at specific level
 */
function log(level, message, data) {
  if (LOG_LEVELS[level] <= currentLevel) {
    console.log(formatLog(level, message, data));
  }
}

export const logger = {
  error: (message, data) => log('error', message, data),
  warn: (message, data) => log('warn', message, data),
  info: (message, data) => log('info', message, data),
  debug: (message, data) => log('debug', message, data),
};

/**
 * Create contextual logger that collects logs in memory
 * Use this for request-scoped logging where you want to return logs in response
 */
export function createContextualLogger() {
  const logs = [];
  
  function logWithBuffer(level, message, data) {
    // Add to buffer
    const logEntry = createLogEntry(level, message, data);
    logs.push(logEntry);
    
    // Also log to console (for CloudWatch)
    if (LOG_LEVELS[level] <= currentLevel) {
      console.log(JSON.stringify(logEntry));
    }
  }
  
  return {
    error: (message, data) => logWithBuffer('error', message, data),
    warn: (message, data) => logWithBuffer('warn', message, data),
    info: (message, data) => logWithBuffer('info', message, data),
    debug: (message, data) => logWithBuffer('debug', message, data),
    getLogs: () => logs,
    clearLogs: () => logs.length = 0,
  };
}

