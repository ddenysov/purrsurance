export interface Pet {
  id: string
  name: string
  species: string
  age: string
  gender: string
  avatar: string
  policyId: string
  coveragePlan: string
}

export interface Vaccination {
  id: string
  name: string
  status: 'completed' | 'due' | 'overdue'
}

export interface Appointment {
  id: string
  title: string
  location: string
  date: string
  time: string
}

export interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: Date
  type?: 'text' | 'confirmation' | 'choice' | 'form'
  metadata?: MessageMetadata
  visible?: boolean // If false, message won't be displayed in UI but will be in history
  agentName?: string // Name of the agent that processed this message
}

export interface MessageMetadata {
  confirmationOptions?: {
    yesLabel?: string
    noLabel?: string
    yesEvent: string
    noEvent: string
    eventPayload?: any
  }
  choiceOptions?: {
    options: Array<{ label: string; value: string; event: string }>
  }
}

/**
 * Chat session information
 */
export interface ChatSession {
  sessionId: string | null
  lastMessageTimestamp?: Date
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'
  message: string
  [key: string]: any
}

/**
 * Backend API response structure
 */
export interface BackendChatResponse {
  message: string
  data: {
    response: string
    sessionId: string
  }
  metadata: {
    requestId: string
    timestamp: string
    environment: string
    logs?: LogEntry[]
    classification?: string // Agent name that processed the message
    agentId?: string // Agent ID
  }
}

/**
 * Backend API error response
 */
export interface BackendErrorResponse {
  error: string
  message: string
  requestId?: string
}

export interface QuickAction {
  id: string
  label: string
  color: string
  prompt: string
}

// API Response types
export interface ApiResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Headers
  success: boolean
  error?: string
}

export interface ApiError {
  message: string
  status: number
  statusText: string
  name: string
}

// Chat API types
export interface ChatRequest {
  message: string
  conversationId?: string
  userId?: string
}

export interface ChatResponse {
  message: string
  conversationId: string
  suggestions?: string[]
  timestamp: string
}

// Pet API types
export interface PetCreateRequest {
  name: string
  species: string
  age: string
  gender: string
  avatar?: string
  coveragePlan: string
}

export interface PetUpdateRequest {
  name?: string
  species?: string
  age?: string
  gender?: string
  avatar?: string
  coveragePlan?: string
}

// Policy API types
export interface PolicyResponse {
  id: string
  petId: string
  coveragePlan: string
  status: 'active' | 'inactive' | 'pending'
  startDate: string
  endDate: string
  premium: number
  deductible: number
  coverageLimit: number
}

// User API types
export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  address?: string
  createdAt: string
  updatedAt: string
}

export interface UserUpdateRequest {
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
}