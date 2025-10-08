/**
 * API Configuration
 * 
 * Gets configuration from Nuxt runtime config which is populated from environment variables.
 * This ensures that URLs are not hardcoded and can be updated via env vars.
 */

// Get runtime config - this will be populated by Nuxt from environment variables
const getRuntimeConfig = () => {
  if (typeof useRuntimeConfig === 'function') {
    return useRuntimeConfig()
  }
  // Fallback for non-Nuxt contexts (like tests)
  return {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
      apiTimeout: process.env.NUXT_PUBLIC_API_TIMEOUT || '10000',
      sseStreamUrl: process.env.NUXT_PUBLIC_SSE_STREAM_URL || 'http://localhost:3002/stream',
    }
  }
}

// API Configuration
export const apiConfig = {
  // Base URL for API requests
  get baseURL() {
    return getRuntimeConfig().public.apiBaseUrl
  },
  
  // Request timeout in milliseconds
  get timeout() {
    return parseInt(getRuntimeConfig().public.apiTimeout)
  },
  
  // Default headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // SSE Stream URL
  get sseStreamUrl() {
    return getRuntimeConfig().public.sseStreamUrl
  },
  
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
