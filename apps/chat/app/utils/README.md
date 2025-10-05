# API Client Documentation

This directory contains the API client implementation for the Purrsurance chat application.

## Files Overview

- `apiClient.ts` - Core API client with fetch-based HTTP methods
- `apiServices.ts` - Domain-specific API services (chat, pets, policies, users, auth)
- `apiConfig.ts` - API configuration and endpoints
- `useApi.ts` - Vue composables for API integration

## Quick Start

### Basic Usage

```typescript
import { useApi } from '~/composables/useApi'

const { chat, pet, policy, user, auth } = useApi()

// Send a chat message
const response = await chat.sendMessage('Hello!', 'conversation-id', 'user-id')

// Get user's pets
const pets = await pet.getPets('user-id')

// Get user profile
const profile = await user.getProfile('user-id')
```

### Using Specific Composables

```typescript
import { useChatApi, usePetApi, useAuthApi } from '~/composables/useApi'

// Chat API
const { sendMessage, isLoading, error } = useChatApi()
await sendMessage('Hello!')

// Pet API
const { getPets, createPet } = usePetApi()
const pets = await getPets('user-id')

// Auth API
const { login, logout, initializeAuth } = useAuthApi()
await login('user@example.com', 'password')
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NUXT_PUBLIC_API_TIMEOUT=10000
NUXT_PUBLIC_APP_ENV=development
```

### Custom Configuration

```typescript
import { apiClient } from '~/utils/apiClient'

// Set custom base URL
apiClient.setBaseURL('https://api.example.com')

// Set authentication token
apiClient.setAuthToken('your-jwt-token')

// Set custom headers
apiClient.setHeader('X-Custom-Header', 'value')
```

## API Services

### Chat API

```typescript
const { chat } = useApi()

// Send message
await chat.sendMessage({
  message: 'Hello!',
  conversationId: 'conv-123',
  userId: 'user-456'
})

// Get conversation history
await chat.getConversation('conv-123')

// Get user conversations
await chat.getUserConversations('user-456')
```

### Pet API

```typescript
const { pet } = useApi()

// Get all pets for user
await pet.getPets('user-456')

// Create new pet
await pet.createPet('user-456', {
  name: 'Fluffy',
  species: 'Cat',
  age: '2 years',
  gender: 'Female',
  coveragePlan: 'Premium'
})

// Upload pet avatar
await pet.uploadAvatar('pet-123', file)
```

### Policy API

```typescript
const { policy } = useApi()

// Get pet policies
await policy.getPetPolicies('pet-123')

// Create new policy
await policy.createPolicy('pet-123', 'Premium')

// Update policy
await policy.updatePolicy('policy-123', {
  status: 'active'
})
```

### User API

```typescript
const { user } = useApi()

// Get user profile
await user.getProfile('user-456')

// Update profile
await user.updateProfile('user-456', {
  firstName: 'John',
  lastName: 'Doe'
})

// Upload avatar
await user.uploadAvatar('user-456', file)
```

### Auth API

```typescript
const { auth } = useApi()

// Login
await auth.login('user@example.com', 'password')

// Register
await auth.register({
  email: 'user@example.com',
  password: 'password',
  firstName: 'John',
  lastName: 'Doe'
})

// Logout
await auth.logout()

// Initialize auth from localStorage
auth.initializeAuth()
```

## Error Handling

The API client includes comprehensive error handling:

```typescript
import { ApiError } from '~/utils/apiClient'

try {
  const response = await chat.sendMessage('Hello!')
  if (response) {
    console.log('Success:', response.data)
  }
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message)
    console.error('Status:', error.status)
  }
}
```

## Loading States

All composables provide loading states:

```vue
<template>
  <div>
    <button @click="sendMessage" :disabled="isLoading">
      {{ isLoading ? 'Sending...' : 'Send Message' }}
    </button>
    
    <div v-if="error" class="error">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
const { sendMessage, isLoading, error } = useChatApi()
</script>
```

## TypeScript Support

The API client is fully typed with TypeScript interfaces:

```typescript
import type { 
  ChatRequest, 
  ChatResponse, 
  Pet, 
  PolicyResponse, 
  UserProfile 
} from '~/types'

// All API methods are fully typed
const response: ApiResponse<ChatResponse> = await chat.sendMessage({
  message: 'Hello!',
  conversationId: 'conv-123'
})
```

## File Upload

The API client supports file uploads:

```typescript
const { pet } = useApi()

// Upload pet avatar
const file = document.getElementById('file-input').files[0]
const response = await pet.uploadAvatar('pet-123', file)

if (response) {
  console.log('Avatar URL:', response.data.avatarUrl)
}
```

## Request/Response Interceptors

You can extend the API client with custom logic:

```typescript
import { apiClient } from '~/utils/apiClient'

// The API client uses fetch internally and can be extended
// with custom request/response handling as needed
```

## Best Practices

1. **Always handle errors**: Use try-catch blocks or check for null responses
2. **Use loading states**: Show loading indicators during API calls
3. **Initialize auth**: Call `initializeAuth()` on app startup
4. **Type safety**: Use TypeScript interfaces for better development experience
5. **Environment config**: Use environment variables for different environments
