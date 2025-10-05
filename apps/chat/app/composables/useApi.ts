import { apiClient, ApiError } from '~/utils/apiClient'
import { apiServices } from '~/utils/apiServices'
import type { ApiResponse } from '~/types'

// Global loading state
const isLoading = ref(false)
const error = ref<string | null>(null)

// API composable
export const useApi = () => {
  // Set authentication token
  const setAuthToken = (token: string) => {
    apiClient.setAuthToken(token)
  }

  // Remove authentication token
  const removeAuthToken = () => {
    apiClient.removeAuthToken()
  }

  // Set custom header
  const setHeader = (key: string, value: string) => {
    apiClient.setHeader(key, value)
  }

  // Remove custom header
  const removeHeader = (key: string) => {
    apiClient.removeHeader(key)
  }

  // Set base URL
  const setBaseURL = (baseURL: string) => {
    apiClient.setBaseURL(baseURL)
  }

  // Generic request wrapper with loading and error handling
  const request = async <T = any>(
    apiCall: () => Promise<ApiResponse<T>>,
    options: {
      showLoading?: boolean
      showError?: boolean
      errorMessage?: string
    } = {}
  ): Promise<ApiResponse<T> | null> => {
    const { showLoading = true, showError = true, errorMessage } = options

    try {
      if (showLoading) {
        isLoading.value = true
      }
      error.value = null

      const response = await apiCall()
      return response
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Unknown error', 0, 'Unknown Error')
      
      if (showError) {
        error.value = errorMessage || apiError.message
        console.error('API Error:', apiError)
      }

      return null
    } finally {
      if (showLoading) {
        isLoading.value = false
      }
    }
  }

  // Clear error
  const clearError = () => {
    error.value = null
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Methods
    setAuthToken,
    removeAuthToken,
    setHeader,
    removeHeader,
    setBaseURL,
    request,
    clearError,
    
    // Services
    ...apiServices
  }
}

// Chat API composable
export const useChatApi = () => {
  const { request, isLoading, error, clearError } = useApi()
  const { chat } = apiServices

  const sendMessage = async (message: string, conversationId?: string, userId?: string) => {
    return request(() => chat.sendMessage({ message, conversationId, userId }))
  }

  const getConversation = async (conversationId: string) => {
    return request(() => chat.getConversation(conversationId))
  }

  const getUserConversations = async (userId: string) => {
    return request(() => chat.getUserConversations(userId))
  }

  const deleteConversation = async (conversationId: string) => {
    return request(() => chat.deleteConversation(conversationId))
  }

  return {
    isLoading,
    error,
    clearError,
    sendMessage,
    getConversation,
    getUserConversations,
    deleteConversation
  }
}

// Pet API composable
export const usePetApi = () => {
  const { request, isLoading, error, clearError } = useApi()
  const { pet } = apiServices

  const getPets = async (userId: string) => {
    return request(() => pet.getPets(userId))
  }

  const getPet = async (petId: string) => {
    return request(() => pet.getPet(petId))
  }

  const createPet = async (userId: string, petData: any) => {
    return request(() => pet.createPet(userId, petData))
  }

  const updatePet = async (petId: string, petData: any) => {
    return request(() => pet.updatePet(petId, petData))
  }

  const deletePet = async (petId: string) => {
    return request(() => pet.deletePet(petId))
  }

  const uploadAvatar = async (petId: string, file: File) => {
    return request(() => pet.uploadAvatar(petId, file))
  }

  return {
    isLoading,
    error,
    clearError,
    getPets,
    getPet,
    createPet,
    updatePet,
    deletePet,
    uploadAvatar
  }
}

// Policy API composable
export const usePolicyApi = () => {
  const { request, isLoading, error, clearError } = useApi()
  const { policy } = apiServices

  const getPetPolicies = async (petId: string) => {
    return request(() => policy.getPetPolicies(petId))
  }

  const getPolicy = async (policyId: string) => {
    return request(() => policy.getPolicy(policyId))
  }

  const getUserPolicies = async (userId: string) => {
    return request(() => policy.getUserPolicies(userId))
  }

  const createPolicy = async (petId: string, coveragePlan: string) => {
    return request(() => policy.createPolicy(petId, coveragePlan))
  }

  const updatePolicy = async (policyId: string, updates: any) => {
    return request(() => policy.updatePolicy(policyId, updates))
  }

  const cancelPolicy = async (policyId: string) => {
    return request(() => policy.cancelPolicy(policyId))
  }

  return {
    isLoading,
    error,
    clearError,
    getPetPolicies,
    getPolicy,
    getUserPolicies,
    createPolicy,
    updatePolicy,
    cancelPolicy
  }
}

// User API composable
export const useUserApi = () => {
  const { request, isLoading, error, clearError } = useApi()
  const { user } = apiServices

  const getProfile = async (userId: string) => {
    return request(() => user.getProfile(userId))
  }

  const updateProfile = async (userId: string, updates: any) => {
    return request(() => user.updateProfile(userId, updates))
  }

  const uploadAvatar = async (userId: string, file: File) => {
    return request(() => user.uploadAvatar(userId, file))
  }

  const deleteAccount = async (userId: string) => {
    return request(() => user.deleteAccount(userId))
  }

  return {
    isLoading,
    error,
    clearError,
    getProfile,
    updateProfile,
    uploadAvatar,
    deleteAccount
  }
}

// Auth API composable
export const useAuthApi = () => {
  const { request, isLoading, error, clearError, setAuthToken, removeAuthToken } = useApi()
  const { auth } = apiServices

  const login = async (email: string, password: string) => {
    const response = await request(() => auth.login(email, password))
    
    if (response?.data?.token) {
      setAuthToken(response.data.token)
      // Store token in localStorage for persistence
      if (process.client) {
        localStorage.setItem('auth_token', response.data.token)
      }
    }
    
    return response
  }

  const register = async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
    const response = await request(() => auth.register(userData))
    
    if (response?.data?.token) {
      setAuthToken(response.data.token)
      // Store token in localStorage for persistence
      if (process.client) {
        localStorage.setItem('auth_token', response.data.token)
      }
    }
    
    return response
  }

  const logout = async () => {
    const response = await request(() => auth.logout())
    removeAuthToken()
    
    // Remove token from localStorage
    if (process.client) {
      localStorage.removeItem('auth_token')
    }
    
    return response
  }

  const refreshToken = async () => {
    const response = await request(() => auth.refreshToken())
    
    if (response?.data?.token) {
      setAuthToken(response.data.token)
      // Update token in localStorage
      if (process.client) {
        localStorage.setItem('auth_token', response.data.token)
      }
    }
    
    return response
  }

  const forgotPassword = async (email: string) => {
    return request(() => auth.forgotPassword(email))
  }

  const resetPassword = async (token: string, newPassword: string) => {
    return request(() => auth.resetPassword(token, newPassword))
  }

  // Initialize auth token from localStorage
  const initializeAuth = () => {
    if (process.client) {
      const token = localStorage.getItem('auth_token')
      if (token) {
        setAuthToken(token)
      }
    }
  }

  return {
    isLoading,
    error,
    clearError,
    login,
    register,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    initializeAuth
  }
}
