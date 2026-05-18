import type {
  ChatRequest,
  ChatResponse,
  Pet,
  PetCreateRequest,
  PetUpdateRequest,
  PolicyResponse,
  UserProfile,
  UserUpdateRequest,
  ApiResponse
} from '@/types'
import { apiClient } from './apiClient'

// Chat API Service
export const chatApi = {
  // Send message to chat
  async sendMessage(request: ChatRequest): Promise<ApiResponse<ChatResponse>> {
    return apiClient.post<ChatResponse>('/chat/messages', request)
  },

  // Get conversation history
  async getConversation(conversationId: string): Promise<ApiResponse<ChatResponse[]>> {
    return apiClient.get<ChatResponse[]>(`/chat/conversations/${conversationId}`)
  },

  // Get user conversations
  async getUserConversations(userId: string): Promise<ApiResponse<ChatResponse[]>> {
    return apiClient.get<ChatResponse[]>(`/chat/users/${userId}/conversations`)
  },

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/chat/conversations/${conversationId}`)
  }
}

// Pet API Service
export const petApi = {
  // Get all pets for user
  async getPets(userId: string): Promise<ApiResponse<Pet[]>> {
    return apiClient.get<Pet[]>(`/pets/users/${userId}`)
  },

  // Get pet by ID
  async getPet(petId: string): Promise<ApiResponse<Pet>> {
    return apiClient.get<Pet>(`/pets/${petId}`)
  },

  // Create new pet
  async createPet(userId: string, petData: PetCreateRequest): Promise<ApiResponse<Pet>> {
    return apiClient.post<Pet>(`/pets/users/${userId}`, petData)
  },

  // Update pet
  async updatePet(petId: string, petData: PetUpdateRequest): Promise<ApiResponse<Pet>> {
    return apiClient.put<Pet>(`/pets/${petId}`, petData)
  },

  // Delete pet
  async deletePet(petId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/pets/${petId}`)
  },

  // Upload pet avatar
  async uploadAvatar(petId: string, file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    return apiClient.upload<{ avatarUrl: string }>(`/pets/${petId}/avatar`, file)
  }
}

// Policy API Service
export const policyApi = {
  // Get policies for pet
  async getPetPolicies(petId: string): Promise<ApiResponse<PolicyResponse[]>> {
    return apiClient.get<PolicyResponse[]>(`/policies/pets/${petId}`)
  },

  // Get policy by ID
  async getPolicy(policyId: string): Promise<ApiResponse<PolicyResponse>> {
    return apiClient.get<PolicyResponse>(`/policies/${policyId}`)
  },

  // Get user policies
  async getUserPolicies(userId: string): Promise<ApiResponse<PolicyResponse[]>> {
    return apiClient.get<PolicyResponse[]>(`/policies/users/${userId}`)
  },

  // Create new policy
  async createPolicy(petId: string, coveragePlan: string): Promise<ApiResponse<PolicyResponse>> {
    return apiClient.post<PolicyResponse>(`/policies/pets/${petId}`, { coveragePlan })
  },

  // Update policy
  async updatePolicy(policyId: string, updates: Partial<PolicyResponse>): Promise<ApiResponse<PolicyResponse>> {
    return apiClient.patch<PolicyResponse>(`/policies/${policyId}`, updates)
  },

  // Cancel policy
  async cancelPolicy(policyId: string): Promise<ApiResponse<PolicyResponse>> {
    return apiClient.patch<PolicyResponse>(`/policies/${policyId}/cancel`)
  }
}

// User API Service
export const userApi = {
  // Get user profile
  async getProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>(`/users/${userId}`)
  },

  // Update user profile
  async updateProfile(userId: string, updates: UserUpdateRequest): Promise<ApiResponse<UserProfile>> {
    return apiClient.patch<UserProfile>(`/users/${userId}`, updates)
  },

  // Upload user avatar
  async uploadAvatar(userId: string, file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    return apiClient.upload<{ avatarUrl: string }>(`/users/${userId}/avatar`, file)
  },

  // Delete user account
  async deleteAccount(userId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/users/${userId}`)
  }
}

// Auth API Service
export const authApi = {
  // Login
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: UserProfile }>> {
    return apiClient.post<{ token: string; user: UserProfile }>('/auth/login', { email, password })
  },

  // Register
  async register(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }): Promise<ApiResponse<{ token: string; user: UserProfile }>> {
    return apiClient.post<{ token: string; user: UserProfile }>('/auth/register', userData)
  },

  // Logout
  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/logout')
  },

  // Refresh token
  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return apiClient.post<{ token: string }>('/auth/refresh')
  },

  // Forgot password
  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/forgot-password', { email })
  },

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/reset-password', { token, newPassword })
  }
}

// Export all services
export const apiServices = {
  chat: chatApi,
  pet: petApi,
  policy: policyApi,
  user: userApi,
  auth: authApi
}
