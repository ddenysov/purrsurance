// API Configuration
export const apiConfig = {
  // Base URL for API requests
  baseURL: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
  
  // Request timeout in milliseconds
  timeout: parseInt(process.env.NUXT_PUBLIC_API_TIMEOUT || '10000'),
  
  // Default headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // Environment
  environment: process.env.NUXT_PUBLIC_APP_ENV || 'development',
  
  // API endpoints
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password'
    },
    chat: {
      messages: '/chat/messages',
      conversations: '/chat/conversations',
      userConversations: '/chat/users'
    },
    pets: {
      list: '/pets',
      create: '/pets',
      update: '/pets',
      delete: '/pets',
      avatar: '/pets/avatar'
    },
    policies: {
      list: '/policies',
      create: '/policies',
      update: '/policies',
      cancel: '/policies/cancel'
    },
    users: {
      profile: '/users',
      avatar: '/users/avatar'
    }
  }
}

// Helper function to get full endpoint URL
export const getEndpointUrl = (endpoint: string): string => {
  return `${apiConfig.baseURL}${endpoint}`
}

// Helper function to check if we're in development mode
export const isDevelopment = (): boolean => {
  return apiConfig.environment === 'development'
}

// Helper function to check if we're in production mode
export const isProduction = (): boolean => {
  return apiConfig.environment === 'production'
}
