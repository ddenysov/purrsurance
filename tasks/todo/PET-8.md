# PET-8: Integrate Chat with Backend API and Add Markdown Parsing

## Description
Refactor the chat system to send user messages to the backend API and display real responses instead of using mocked AI replies. Implement markdown parsing using the `markdown-it` library to properly render formatted responses from the backend.

## Business Logic
1. **Backend Integration**: Replace mocked chat responses with real API calls
2. **Session Management**: Maintain conversation context through sessionId
3. **Markdown Rendering**: Parse and display markdown-formatted responses
4. **Error Handling**: Gracefully handle API failures with user-friendly messages
5. **Loading States**: Show appropriate feedback during API calls

## Technical Overview

### Current State
```
User Message → useChat → generateAIResponse (mocked) → Display
```

### Target State
```
User Message → useChat → Backend API → Parse Markdown → Display
```

### Response Format from Backend
```json
{
  "message": "Success",
  "data": {
    "response": "Markdown formatted text...",
    "sessionId": "session-1759739665219-wvggfs"
  },
  "metadata": {
    "requestId": "local-1759739665219",
    "timestamp": "2025-10-06T08:34:30.728Z",
    "environment": "dev"
  }
}
```

---

## Implementation Steps

### Step 1: Install Dependencies

**What to do:**
Add `markdown-it` and its TypeScript types to the chat app.

**Command:**
```bash
cd apps/chat
pnpm add markdown-it
pnpm add -D @types/markdown-it
```

**Why:**
- `markdown-it` is a fast and flexible markdown parser
- Type definitions improve development experience and type safety

---

### Step 2: Create Markdown Utility

**What to do:**
Create a utility module for markdown parsing and sanitization.

**Create new file: `apps/chat/app/utils/markdown.ts`**

```typescript
import MarkdownIt from 'markdown-it'

/**
 * Initialize markdown-it with safe defaults
 * Configured for security and readability
 */
const md = new MarkdownIt({
  html: false,        // Disable HTML tags for security
  xhtmlOut: false,    // Use HTML5 style
  breaks: true,       // Convert \n to <br>
  linkify: true,      // Auto-convert URLs to links
  typographer: true,  // Enable smart quotes and other typographic replacements
})

/**
 * Parse markdown text to HTML
 * @param text - Raw markdown text
 * @returns Rendered HTML string
 */
export function parseMarkdown(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }
  
  try {
    return md.render(text)
  } catch (error) {
    console.error('Error parsing markdown:', error)
    // Fallback to plain text if parsing fails
    return text.replace(/\n/g, '<br>')
  }
}

/**
 * Parse inline markdown (without wrapping in <p> tags)
 * @param text - Raw markdown text
 * @returns Rendered HTML string
 */
export function parseMarkdownInline(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }
  
  try {
    return md.renderInline(text)
  } catch (error) {
    console.error('Error parsing inline markdown:', error)
    return text
  }
}

/**
 * Strip markdown formatting and return plain text
 * Useful for previews or meta descriptions
 * @param text - Markdown text
 * @returns Plain text without markdown syntax
 */
export function stripMarkdown(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }
  
  return text
    .replace(/[#*_~`[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}

/**
 * Truncate markdown text to specified length
 * Strips markdown before truncating for accurate length
 * @param text - Markdown text
 * @param maxLength - Maximum length
 * @returns Truncated plain text
 */
export function truncateMarkdown(text: string, maxLength: number = 100): string {
  const plain = stripMarkdown(text)
  
  if (plain.length <= maxLength) {
    return plain
  }
  
  return plain.substring(0, maxLength).trim() + '...'
}
```

**Important notes:**
- HTML is disabled for security (prevents XSS attacks)
- `breaks: true` converts line breaks to `<br>` tags
- `linkify: true` automatically converts URLs to clickable links
- Error handling ensures the app doesn't crash on malformed markdown

---

### Step 3: Update Chat Types

**What to do:**
Add session tracking to chat types.

**Update file: `apps/chat/app/types/index.ts`**

Add after the existing ChatMessage type:

```typescript
/**
 * Chat session information
 */
export interface ChatSession {
  sessionId: string | null
  lastMessageTimestamp?: Date
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
```

**Why:**
- Proper TypeScript types improve code quality and IDE support
- Defines the contract between frontend and backend
- Makes error handling more robust

---

### Step 4: Create Backend Chat Service

**What to do:**
Create a dedicated service for chat API calls.

**Create new file: `apps/chat/app/utils/chatService.ts`**

```typescript
import type { BackendChatResponse, BackendErrorResponse } from '~/types'
import { apiClient } from './apiClient'

/**
 * Chat service configuration
 */
const CHAT_API_CONFIG = {
  // Production endpoint
  baseURL: 'https://cbx2umgj5k.execute-api.us-east-1.amazonaws.com/Prod',
  
  // API path
  endpoint: '/hello/',
  
  // Request timeout (30 seconds for AI processing)
  timeout: 30000,
}

/**
 * Send message to backend chat API
 * @param message - User message text
 * @param sessionId - Optional session ID for conversation continuity
 * @returns Backend response with AI reply
 * @throws Error if request fails
 */
export async function sendChatMessage(
  message: string,
  sessionId: string | null = null
): Promise<BackendChatResponse> {
  try {
    // Prepare request payload
    const payload: { message: string; sessionId?: string } = {
      message: message.trim(),
    }
    
    // Include sessionId if available
    if (sessionId) {
      payload.sessionId = sessionId
    }
    
    console.log('Sending chat message:', {
      messageLength: message.length,
      hasSessionId: !!sessionId,
    })
    
    // Make API request
    const response = await apiClient.post<BackendChatResponse>(
      CHAT_API_CONFIG.endpoint,
      payload,
      {
        baseURL: CHAT_API_CONFIG.baseURL,
        timeout: CHAT_API_CONFIG.timeout,
      }
    )
    
    console.log('Chat response received:', {
      requestId: response.data.metadata?.requestId,
      sessionId: response.data.data?.sessionId,
      responseLength: response.data.data?.response?.length,
    })
    
    // Validate response structure
    if (!response.data?.data?.response) {
      throw new Error('Invalid response structure from backend')
    }
    
    return response.data
    
  } catch (error: any) {
    console.error('Chat API error:', error)
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data as BackendErrorResponse
      
      throw new Error(
        errorData.message || 
        `Server error: ${error.response.status}`
      )
    } else if (error.request) {
      // Request made but no response received
      throw new Error(
        'No response from server. Please check your connection and try again.'
      )
    } else {
      // Error in request setup
      throw new Error(
        error.message || 'Failed to send message. Please try again.'
      )
    }
  }
}

/**
 * Test backend connection
 * Useful for health checks
 * @returns true if backend is reachable
 */
export async function testBackendConnection(): Promise<boolean> {
  try {
    await sendChatMessage('Hello', null)
    return true
  } catch (error) {
    console.error('Backend connection test failed:', error)
    return false
  }
}

/**
 * Get chat API status
 * @returns Status information
 */
export function getChatAPIStatus() {
  return {
    baseURL: CHAT_API_CONFIG.baseURL,
    endpoint: CHAT_API_CONFIG.endpoint,
    timeout: CHAT_API_CONFIG.timeout,
  }
}
```

**Important notes:**
- 30-second timeout for AI processing
- Comprehensive error handling for different failure scenarios
- Session management support
- Logging for debugging
- Type-safe API calls

---

### Step 5: Refactor useChat Composable

**What to do:**
Update the chat composable to use the backend API instead of mocked responses.

**Update file: `apps/chat/app/composables/useChat.ts`**

Replace the entire file with:

```typescript
import type { ChatMessage, ChatSession } from '~/types'
import { usePetProfile } from './usePetProfile'
import { sendChatMessage } from '~/utils/chatService'
import { parseMarkdown } from '~/utils/markdown'

export const useChat = () => {
  // Chat messages state
  const messages = ref<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m your Purrsurance AI assistant. I\'m here to help you with your pet insurance needs. How can I assist you today?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ])

  // Typing indicator state
  const isTyping = ref(false)
  
  // Session tracking
  const session = ref<ChatSession>({
    sessionId: null,
    lastMessageTimestamp: undefined,
  })
  
  // Error state
  const error = ref<string | null>(null)

  // Generate unique ID for messages
  const generateMessageId = (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  // Add message to chat
  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: new Date()
    }
    messages.value.push(newMessage)
    session.value.lastMessageTimestamp = newMessage.timestamp
  }

  // Check if message contains policy ID pattern
  const containsPolicyId = (text: string): boolean => {
    // Match patterns like PS-1234567 or similar
    const policyIdPattern = /\b[A-Z]{2}-?\d{6,8}\b/i
    return policyIdPattern.test(text)
  }

  // Send user message and get AI response from backend
  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    // Clear any previous errors
    error.value = null

    // Add user message
    addMessage({
      content: text.trim(),
      sender: 'user'
    })

    // Show typing indicator
    isTyping.value = true

    try {
      // Send message to backend
      const response = await sendChatMessage(
        text.trim(),
        session.value.sessionId
      )
      
      // Update session ID
      if (response.data.sessionId) {
        session.value.sessionId = response.data.sessionId
      }
      
      // Parse markdown in response
      const parsedResponse = parseMarkdown(response.data.response)
      
      // Check if message contains policy ID and unlock pet details
      if (containsPolicyId(text)) {
        const { unlockPetDetails } = usePetProfile()
        unlockPetDetails()
      }
      
      // Hide typing indicator
      isTyping.value = false
      
      // Add AI response with parsed markdown
      addMessage({
        content: parsedResponse,
        sender: 'assistant'
      })
      
    } catch (err: any) {
      // Hide typing indicator
      isTyping.value = false
      
      // Store error
      error.value = err.message || 'Failed to send message'
      
      // Add error message to chat
      addMessage({
        content: `Sorry, I encountered an error: ${error.value}. Please try again.`,
        sender: 'assistant'
      })
      
      console.error('Error sending message:', err)
    }
  }

  // Simulate typing with delay (for testing purposes)
  const simulateTyping = async (delay: number = 1000) => {
    isTyping.value = true
    await new Promise(resolve => setTimeout(resolve, delay))
    isTyping.value = false
  }

  // Clear all messages and reset session
  const clearMessages = () => {
    messages.value = [{
      id: '1',
      content: 'Hello! I\'m your Purrsurance AI assistant. I\'m here to help you with your pet insurance needs. How can I assist you today?',
      sender: 'assistant',
      timestamp: new Date()
    }]
    session.value = {
      sessionId: null,
      lastMessageTimestamp: undefined,
    }
    error.value = null
  }

  // Get last message
  const getLastMessage = (): ChatMessage | undefined => {
    return messages.value[messages.value.length - 1]
  }

  // Get messages by sender
  const getMessagesBySender = (sender: 'user' | 'assistant'): ChatMessage[] => {
    return messages.value.filter(msg => msg.sender === sender)
  }
  
  // Get current session ID
  const getSessionId = (): string | null => {
    return session.value.sessionId
  }
  
  // Reset session (start new conversation)
  const resetSession = () => {
    session.value = {
      sessionId: null,
      lastMessageTimestamp: undefined,
    }
  }

  return {
    messages: readonly(messages),
    isTyping: readonly(isTyping),
    error: readonly(error),
    sessionId: computed(() => session.value.sessionId),
    sendMessage,
    addMessage,
    simulateTyping,
    clearMessages,
    getLastMessage,
    getMessagesBySender,
    getSessionId,
    resetSession,
  }
}
```

**Key changes:**
- Removed dependency on `generateAIResponse` (mocked function)
- Added `sendChatMessage` from chat service
- Added `parseMarkdown` for rendering
- Added session tracking
- Added error handling and error state
- Added `resetSession` method
- Policy ID detection moved into composable
- Better logging and debugging

---

### Step 6: Update ChatMessage Component

**What to do:**
Update the ChatMessage component to render HTML from markdown safely.

**Update file: `apps/chat/app/components/chat/ChatMessage.vue`**

Find the message content rendering section and update it:

```vue
<template>
  <div 
    :class="[
      'flex gap-3 p-4',
      message.sender === 'user' ? 'justify-end' : 'justify-start'
    ]"
  >
    <!-- Assistant Avatar (left side) -->
    <AssistantAvatar 
      v-if="message.sender === 'assistant'"
      class="flex-shrink-0"
    />
    
    <!-- Message Bubble -->
    <div
      :class="[
        'max-w-[70%] rounded-2xl px-4 py-3',
        message.sender === 'user'
          ? 'bg-purple-600 text-white'
          : 'bg-gray-100 text-gray-900'
      ]"
    >
      <!-- Render HTML content from markdown -->
      <div 
        v-if="message.sender === 'assistant'"
        class="prose prose-sm max-w-none"
        :class="{
          'prose-invert': message.sender === 'user'
        }"
        v-html="message.content"
      />
      
      <!-- Plain text for user messages -->
      <p 
        v-else
        class="text-sm whitespace-pre-wrap break-words"
      >
        {{ message.content }}
      </p>
      
      <!-- Timestamp -->
      <div 
        :class="[
          'text-xs mt-1',
          message.sender === 'user' ? 'text-purple-200' : 'text-gray-500'
        ]"
      >
        {{ formatTime(message.timestamp) }}
      </div>
    </div>
    
    <!-- User Avatar (right side) -->
    <div 
      v-if="message.sender === 'user'"
      class="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold"
    >
      U
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types'
import AssistantAvatar from './AssistantAvatar.vue'

interface Props {
  message: ChatMessage
}

defineProps<Props>()

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>

<style scoped>
/* Markdown prose styles for assistant messages */
.prose {
  @apply text-gray-900;
}

.prose :deep(p) {
  @apply mb-2 last:mb-0;
}

.prose :deep(strong) {
  @apply font-semibold text-gray-900;
}

.prose :deep(em) {
  @apply italic;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4) {
  @apply font-bold mt-4 mb-2 first:mt-0;
}

.prose :deep(h1) {
  @apply text-xl;
}

.prose :deep(h2) {
  @apply text-lg;
}

.prose :deep(h3) {
  @apply text-base;
}

.prose :deep(ul),
.prose :deep(ol) {
  @apply ml-4 mb-2;
}

.prose :deep(li) {
  @apply mb-1;
}

.prose :deep(ul li) {
  @apply list-disc;
}

.prose :deep(ol li) {
  @apply list-decimal;
}

.prose :deep(a) {
  @apply text-purple-600 hover:text-purple-700 underline;
}

.prose :deep(code) {
  @apply bg-gray-200 px-1 py-0.5 rounded text-sm font-mono;
}

.prose :deep(pre) {
  @apply bg-gray-200 p-2 rounded overflow-x-auto mb-2;
}

.prose :deep(blockquote) {
  @apply border-l-4 border-gray-300 pl-4 italic my-2;
}

.prose :deep(hr) {
  @apply border-gray-300 my-4;
}
</style>
```

**Important notes:**
- `v-html` is used for assistant messages (markdown rendered)
- Plain text for user messages (no markdown parsing needed)
- Tailwind's `prose` classes for beautiful typography
- Deep selectors for styling markdown elements
- XSS protection: HTML tags are disabled in markdown-it config

---

### Step 7: Update CSS for Markdown Rendering

**What to do:**
Ensure Tailwind Typography plugin is available or add custom styles.

**Check file: `apps/chat/app/assets/css/main.css`**

Add if not present:

```css
/* Markdown content styles */
.prose {
  color: inherit;
  max-width: 65ch;
}

.prose p {
  margin-bottom: 0.5rem;
}

.prose p:last-child {
  margin-bottom: 0;
}

.prose a {
  color: #7c3aed;
  text-decoration: underline;
}

.prose a:hover {
  color: #6d28d9;
}

.prose strong {
  font-weight: 600;
}

.prose code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

.prose pre {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.prose pre code {
  background-color: transparent;
  padding: 0;
}

.prose ul,
.prose ol {
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
}

.prose li {
  margin-bottom: 0.25rem;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  font-weight: 700;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.prose h1:first-child,
.prose h2:first-child,
.prose h3:first-child {
  margin-top: 0;
}

.prose blockquote {
  border-left: 4px solid #e5e7eb;
  padding-left: 1rem;
  font-style: italic;
  margin: 0.75rem 0;
}

.prose hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1rem 0;
}
```

**Why:**
- Provides consistent styling for markdown elements
- Works without requiring additional dependencies
- Customizable for brand colors
- Handles all common markdown elements

---

### Step 8: Remove Deprecated Mock Files

**What to do:**
Remove or deprecate the mocked AI response utility since it's no longer needed.

**Option 1: Delete file (recommended)**
```bash
rm apps/chat/app/utils/aiReply.ts
```

**Option 2: Keep for reference with deprecation notice**

Add to top of `apps/chat/app/utils/aiReply.ts`:

```typescript
/**
 * @deprecated This file is no longer used. Chat now uses real backend API.
 * See: chatService.ts for backend integration
 * See: PET-8 for migration details
 * Keeping for historical reference only.
 */
```

**Important:**
Remove all imports of `generateAIResponse` from other files.

---

### Step 9: Add Error Handling UI

**What to do:**
Add visual feedback for errors in the chat interface.

**Update file: `apps/chat/app/components/chat/ChatMessages.vue`**

Add error display section:

```vue
<template>
  <div class="flex-1 overflow-y-auto p-4 space-y-2">
    <!-- Error banner -->
    <div 
      v-if="error"
      class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
    >
      <svg 
        class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path 
          fill-rule="evenodd" 
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
          clip-rule="evenodd" 
        />
      </svg>
      <div class="flex-1">
        <h4 class="text-sm font-semibold text-red-800">Connection Error</h4>
        <p class="text-sm text-red-700 mt-1">{{ error }}</p>
      </div>
    </div>

    <!-- Messages -->
    <ChatMessage
      v-for="message in messages"
      :key="message.id"
      :message="message"
    />
    
    <!-- Typing indicator -->
    <ChatTypingIndicator v-if="isTyping" />
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types'
import ChatMessage from './ChatMessage.vue'
import ChatTypingIndicator from './ChatTypingIndicator.vue'

interface Props {
  messages: readonly ChatMessage[]
  isTyping: boolean
  error?: string | null
}

defineProps<Props>()
</script>
```

**Update parent component usage:**

```vue
<ChatMessages 
  :messages="messages" 
  :isTyping="isTyping"
  :error="error"
/>
```

---

### Step 10: Add Loading States

**What to do:**
Improve UX with better loading indicators.

**Update file: `apps/chat/app/components/chat/ChatTypingIndicator.vue`**

Enhance the typing indicator:

```vue
<template>
  <div class="flex gap-3 p-4">
    <!-- Assistant Avatar -->
    <AssistantAvatar class="flex-shrink-0" />
    
    <!-- Typing Bubble -->
    <div class="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
      <div class="flex gap-1">
        <span 
          v-for="dot in 3" 
          :key="dot"
          class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          :style="{ animationDelay: `${dot * 0.15}s` }"
        />
      </div>
      <span class="text-sm text-gray-600 ml-2">
        AI is thinking...
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import AssistantAvatar from './AssistantAvatar.vue'
</script>

<style scoped>
@keyframes bounce {
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
}

.animate-bounce {
  animation: bounce 1.4s infinite ease-in-out;
}
</style>
```

---

### Step 11: Update Documentation

**What to do:**
Update README files to reflect the new backend integration.

**Update or create: `apps/chat/README.md`**

Add section:

```markdown
## Chat Backend Integration

The chat system now uses a real backend API powered by AWS Bedrock Agent.

### Features

- **Real AI Responses**: Powered by AWS Bedrock Agent
- **Session Management**: Maintains conversation context
- **Markdown Rendering**: Beautifully formatted responses
- **Error Handling**: Graceful fallbacks for network issues

### Configuration

Backend API endpoint is configured in `utils/chatService.ts`:

```typescript
const CHAT_API_CONFIG = {
  baseURL: 'https://cbx2umgj5k.execute-api.us-east-1.amazonaws.com/Prod',
  endpoint: '/hello/',
  timeout: 30000,
}
```

### Response Format

The backend returns structured responses:

```json
{
  "message": "Success",
  "data": {
    "response": "Markdown formatted response",
    "sessionId": "unique-session-id"
  },
  "metadata": {
    "requestId": "request-id",
    "timestamp": "ISO timestamp",
    "environment": "dev|prod"
  }
}
```

### Markdown Support

Responses support full markdown syntax:

- **Bold** and *italic* text
- Lists (ordered and unordered)
- Links and references
- Code blocks
- Blockquotes
- Headings
- And more...

### Testing

Test the chat integration:

1. Start the dev server: `pnpm dev`
2. Open the chat interface
3. Send a message
4. Verify response from backend
5. Check browser console for logs

### Troubleshooting

**No response from backend:**
- Check network tab in browser DevTools
- Verify backend API is running
- Check CORS configuration

**Markdown not rendering:**
- Check browser console for errors
- Verify `markdown-it` is installed
- Check CSS styles are loaded

**Session not persisting:**
- Verify sessionId in response
- Check browser console logs
- Ensure session state is managed correctly
```

---

## Testing Plan

### Unit Tests
1. [ ] Test `parseMarkdown()` with various markdown inputs
2. [ ] Test `stripMarkdown()` function
3. [ ] Test `truncateMarkdown()` function
4. [ ] Test `sendChatMessage()` with mock API
5. [ ] Test error handling in chat service

### Integration Tests
1. [ ] Test complete message flow (user → backend → display)
2. [ ] Test session management across messages
3. [ ] Test markdown rendering in UI
4. [ ] Test error states and recovery
5. [ ] Test policy ID detection and unlocking

### Manual Testing Checklist
1. [ ] Send simple text message
2. [ ] Send message with policy ID
3. [ ] Verify markdown rendering (bold, italic, lists, etc.)
4. [ ] Test with network disconnected (error handling)
5. [ ] Test session continuity (multiple messages)
6. [ ] Test message history persistence
7. [ ] Test clear messages functionality
8. [ ] Test typing indicators
9. [ ] Verify mobile responsiveness
10. [ ] Check browser console for errors

---

## Acceptance Criteria

- [ ] `markdown-it` installed and configured
- [ ] Markdown utility created with parsing functions
- [ ] Chat types updated with session and response interfaces
- [ ] Chat service created for backend communication
- [ ] `useChat` composable refactored to use backend
- [ ] Removed mocked AI response generation
- [ ] ChatMessage component renders markdown safely
- [ ] CSS styles support markdown elements
- [ ] Error handling implemented with user feedback
- [ ] Loading states improved
- [ ] Documentation updated
- [ ] All manual tests passing
- [ ] No console errors
- [ ] Session management working
- [ ] Policy ID detection functional

---

## Security Considerations

### XSS Prevention
- ✅ HTML tags disabled in markdown-it config
- ✅ Only safe markdown elements rendered
- ✅ No `javascript:` links allowed
- ✅ User input is not directly rendered as HTML

### API Security
- ✅ HTTPS only for API calls
- ✅ No sensitive data in URLs (POST body only)
- ✅ Request timeout prevents hanging
- ✅ Error messages don't expose system details

### Session Security
- ✅ Session IDs generated by backend
- ✅ No PII in session storage
- ✅ Sessions can be reset by user

---

## Performance Considerations

- **Markdown Parsing**: Fast (< 1ms for typical messages)
- **API Timeout**: 30 seconds (appropriate for AI processing)
- **Message History**: Limited by client memory only
- **Rendering**: Virtual scrolling could be added for 1000+ messages

**Optimization opportunities:**
- Add response caching for identical queries
- Implement message pagination/virtualization
- Add service worker for offline support
- Compress large responses

---

## Dependencies

- **Requires PET-7**: Backend API must be deployed and functional
- **Required packages**: 
  - `markdown-it` (^14.0.0)
  - `@types/markdown-it` (^14.0.0)

---

## Rollback Plan

If issues occur:

1. Revert `useChat.ts` to previous version (git)
2. Re-enable mocked responses temporarily
3. Remove markdown parsing
4. Investigate and fix issues
5. Re-deploy with fixes

---

## Files Changed Summary

### New Files
- `apps/chat/app/utils/markdown.ts` - Markdown parsing utilities
- `apps/chat/app/utils/chatService.ts` - Backend API service

### Modified Files
- `apps/chat/app/composables/useChat.ts` - Refactored for backend
- `apps/chat/app/components/chat/ChatMessage.vue` - Added markdown rendering
- `apps/chat/app/components/chat/ChatMessages.vue` - Added error display
- `apps/chat/app/components/chat/ChatTypingIndicator.vue` - Enhanced UI
- `apps/chat/app/types/index.ts` - Added new types
- `apps/chat/app/assets/css/main.css` - Added markdown styles
- `apps/chat/package.json` - Added dependencies
- `apps/chat/README.md` - Updated documentation

### Removed Files (optional)
- `apps/chat/app/utils/aiReply.ts` - No longer needed

---

## Priority
High

## Estimated Time
4-6 hours (including testing and documentation)

## Created
2025-10-06

## Assignee
AI Agent / Dmytro

## Labels
frontend, chat, api-integration, markdown, nuxt, typescript

## Status
Todo

## Related Tasks
- Depends on: PET-7 (Backend API must be working)
- Blocks: Future chat enhancements
- Related to: PET-4 (Chat UI components)

---

## Notes for Implementation

### Important Reminders
- Test with real backend before marking complete
- Ensure markdown-it doesn't allow HTML injection
- Handle long responses gracefully
- Test on mobile devices
- Check accessibility (screen readers)

### Common Issues to Avoid
- Don't forget to install dependencies
- Don't use `innerHTML` without sanitization
- Don't forget error boundaries
- Don't skip loading states
- Don't expose sensitive error details to users

### Best Practices
- Keep chat service separate from composable
- Use TypeScript types strictly
- Log important events for debugging
- Handle edge cases (empty responses, timeouts)
- Provide helpful error messages

---

## Success Metrics

After implementation:
- ✅ Chat sends real messages to backend
- ✅ Responses are formatted with markdown
- ✅ Session continuity works across messages
- ✅ Errors are handled gracefully
- ✅ UI remains responsive during API calls
- ✅ No memory leaks or performance issues
- ✅ Mobile experience is smooth
- ✅ Accessibility maintained

---

## Future Enhancements

Consider for future tasks:
- [ ] Add message retry mechanism
- [ ] Implement response streaming
- [ ] Add message reactions/feedback
- [ ] Add conversation export
- [ ] Add message search
- [ ] Add typing indicators from backend
- [ ] Add read receipts
- [ ] Add message editing
- [ ] Add attachments support
- [ ] Add voice input

