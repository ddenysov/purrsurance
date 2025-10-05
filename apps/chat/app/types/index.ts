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
}

export interface QuickAction {
  id: string
  label: string
  color: string
  prompt: string
}