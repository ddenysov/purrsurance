# PET-3: Implement Purrsurance Chat Interface

## Description
Implement the complete Purrsurance AI Insurance Assistant interface for pets based on the v2 mockup. Create a clean, component-based architecture with proper separation of concerns.

## Design Requirements
- Use Tailwind CSS with custom brand colors (mint, brand pink)
- Implement responsive layout (mobile-first, 1-column on mobile, 3-column on desktop)
- Clean, light theme with soft shadows
- Smooth interactions and animations

## Architecture Overview

### Component Structure
```
components/
├── layout/
│   ├── AppHeader.vue          # Top navigation with logo and title
│   └── AppFooter.vue          # Optional footer (if needed later)
├── pet/
│   ├── PetProfile.vue         # Main pet profile card (parent)
│   ├── PetAvatar.vue          # Pet image with edit button
│   ├── PetInfo.vue            # Name, species, age display
│   ├── PetPolicyCards.vue     # Policy ID and coverage info
│   ├── PetVaccinations.vue    # Vaccination badges list
│   ├── PetUpcoming.vue        # Upcoming appointments list
│   └── PetQuickActions.vue    # Quick action buttons
├── chat/
│   ├── ChatContainer.vue      # Main chat wrapper
│   ├── ChatHeader.vue         # Chat header with agent info
│   ├── ChatMessages.vue       # Messages container
│   ├── ChatMessage.vue        # Single message bubble (user or assistant)
│   ├── ChatTypingIndicator.vue # Typing animation dots
│   └── ChatComposer.vue       # Message input with send button
└── modals/
    └── PetProfileModal.vue    # Edit profile modal

pages/
└── index.vue                  # Main page layout (2-column grid)
```

### State Management (Composables)
```
composables/
├── usePetProfile.ts           # Pet profile state and methods
├── useChat.ts                 # Chat messages state and methods
└── useModal.ts                # Modal visibility state
```

### Utilities
```
utils/
├── sanitize.ts                # Sanitize user input for XSS protection
├── aiReply.ts                 # AI response logic (pattern matching)
└── dateFormatter.ts           # Date formatting helpers
```

### Types
```
types/
└── index.ts                   # All TypeScript interfaces
    - Pet
    - ChatMessage
    - Vaccination
    - Appointment
```

---

## Implementation Tasks

### Step 1: TypeScript Types
**File:** `app/types/index.ts`

Define all data structures:
```typescript
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
```

---

### Step 2: Utility Functions
**Files:**
- `app/utils/sanitize.ts` - HTML sanitization
- `app/utils/aiReply.ts` - AI response generator
- `app/utils/dateFormatter.ts` - Date formatting

Keep these simple and pure functions. No side effects.

---

### Step 3: Composables

#### `app/composables/usePetProfile.ts`
Manage pet profile state:
- `pet` - reactive pet object
- `vaccinations` - reactive array
- `appointments` - reactive array
- `updatePetProfile(data)` - update pet info
- Initial data should match mockup (Luna, the cat)

#### `app/composables/useChat.ts`
Manage chat state:
- `messages` - reactive messages array
- `isTyping` - reactive boolean
- `sendMessage(text)` - add user message and generate AI reply
- `addMessage(message)` - add message to array
- `simulateTyping()` - show typing indicator with delay

#### `app/composables/useModal.ts`
Simple modal state:
- `isOpen` - reactive boolean
- `openModal()` - set to true
- `closeModal()` - set to false

---

### Step 4: Layout Components

#### `app/components/layout/AppHeader.vue`
Requirements:
- Sticky header with backdrop blur
- Logo (paw SVG) on the left
- "Purrsurance" title with subtitle
- Badges on the right (desktop only): "Clean UI", "Light Theme", "Pet Friendly"
- Use Tailwind classes from mockup

---

### Step 5: Pet Profile Components

#### `app/components/pet/PetProfile.vue`
Requirements:
- Parent wrapper component
- White card with rounded corners and soft shadow
- Uses all child components (PetAvatar, PetInfo, etc.)
- Passes props down to children
- Grid layout on mobile, single column

#### `app/components/pet/PetAvatar.vue`
Props: `avatar` (string), `name` (string)
- Display pet image
- Edit button (pencil icon) that emits `@edit` event

#### `app/components/pet/PetInfo.vue`
Props: `name`, `species`, `age`, `gender`
- Display name with species badge
- Display age and gender in small text

#### `app/components/pet/PetPolicyCards.vue`
Props: `policyId`, `coveragePlan`
- Two-column grid
- Each card has label and value

#### `app/components/pet/PetVaccinations.vue`
Props: `vaccinations` (array)
- Display vaccination badges
- Different colors based on status (mint = completed, slate = normal, strikethrough = due)

#### `app/components/pet/PetUpcoming.vue`
Props: `appointments` (array)
- List of upcoming events
- Calendar icon
- Each item shows title, location, date, time
- "Reschedule" button (not functional yet, just UI)

#### `app/components/pet/PetQuickActions.vue`
Props: `actions` (array of QuickAction)
- Buttons with colored dots
- Emit `@action-click` with action ID

---

### Step 6: Chat Components

#### `app/components/chat/ChatContainer.vue`
Requirements:
- White card container
- Flex column layout
- Fixed height (72vh)
- Contains ChatHeader, ChatMessages, ChatComposer

#### `app/components/chat/ChatHeader.vue`
Requirements:
- Agent avatar (paw icon) with online status indicator
- "Purrsurance Agent" name
- "Online • Friendly & HIPAA-ready" status
- Info text on desktop

#### `app/components/chat/ChatMessages.vue`
Props: `messages` (array), `isTyping` (boolean)
Requirements:
- Scrollable area (no scrollbar)
- Auto-scroll to bottom on new message
- Loop through messages and render ChatMessage
- Show ChatTypingIndicator if isTyping
- Initial welcome message from assistant with suggestion buttons

#### `app/components/chat/ChatMessage.vue`
Props: `message` (ChatMessage object)
Requirements:
- Different styling for user vs assistant
- User: right-aligned, mint background
- Assistant: left-aligned, slate background with paw icon
- Support HTML content (v-html for assistant messages)

#### `app/components/chat/ChatTypingIndicator.vue`
Requirements:
- Three animated dots
- Paw icon avatar
- Same styling as assistant message

#### `app/components/chat/ChatComposer.vue`
Emits: `@send` (message text)
Requirements:
- Textarea with placeholder
- Auto-resize on input
- Attach button (icon only, not functional)
- Send button (mint green)
- Enter to send, Shift+Enter for new line
- Clear input after send
- Help text below

---

### Step 7: Modal Component

#### `app/components/modals/PetProfileModal.vue`
Props: `isOpen` (boolean), `pet` (Pet object)
Emits: `@close`, `@save` (updated pet data)
Requirements:
- Fixed overlay (dark transparent)
- Centered modal card
- Form with inputs: name, species, age, gender, policyId, coveragePlan
- Close button (X icon)
- Cancel and Save buttons
- Form validation (all fields required)

---

### Step 8: Main Page

#### `app/pages/index.vue`
Requirements:
- Use default layout
- Two-column grid (1 col on mobile, 3 cols on desktop)
- Left column: PetProfile (spans 1 col)
- Right column: ChatContainer (spans 2 cols)
- Connect all composables
- Handle events:
  - PetAvatar @edit → open modal
  - QuickActions @action-click → populate chat input
  - ChatComposer @send → send message
  - Modal @save → update pet profile
  - Suggestion buttons → populate chat input

---

### Step 9: Styling

#### `app/app.vue`
Requirements:
- Add Tailwind config with custom colors (brand, mint)
- Add custom CSS:
  - Paw pattern animation (`.paw-corner:before`)
  - Typing indicator animation (`.typing span`)
  - Hide scrollbar (`.no-scrollbar`)
- Global gradient background

#### Tailwind Config
Add to `nuxt.config.ts`:
```typescript
tailwindcss: {
  config: {
    theme: {
      extend: {
        colors: {
          brand: { /* pink shades */ },
          mint: { /* green shades */ }
        },
        boxShadow: {
          soft: '0 10px 25px -10px rgba(16, 24, 40, .08)...'
        }
      }
    }
  }
}
```

---

### Step 10: Initial Data & Logic

#### AI Reply Logic (`utils/aiReply.ts`)
Simple pattern matching:
- Check for keywords (policy, vet, pharmacy, coverage)
- Return appropriate response
- Include follow-up suggestions

#### Default Pet Data
In `usePetProfile.ts`:
- Name: Luna
- Species: Cat
- Age: 2 years
- Gender: Female
- Policy: PS-2578412
- Coverage: Premium 80%
- Avatar: https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=480

#### Default Chat Message
Welcome message with 3 suggestion buttons

---

## Acceptance Criteria
- [ ] All components are created and properly structured
- [ ] TypeScript types are defined for all data
- [ ] Composables manage state correctly
- [ ] Pet profile displays all information
- [ ] Chat interface works (send/receive messages)
- [ ] Typing indicator appears during AI response
- [ ] Edit modal opens and saves changes
- [ ] Quick actions populate chat input
- [ ] Responsive design (mobile and desktop)
- [ ] All styling matches mockup v2
- [ ] No console errors or warnings
- [ ] Code is clean with proper component separation

## Technical Notes
- **Keep components small** - each should do ONE thing
- **Use props for data down, events for actions up**
- **No business logic in components** - use composables
- **No hardcoded data in components** - pass via props
- **Use TypeScript strictly** - no `any` types
- **Use Composition API** - `<script setup>` syntax
- **Emit events, don't mutate props**
- **Keep styling in template** - use Tailwind classes
- **Sanitize ALL user input** before displaying

## Testing Checklist
- [ ] Type a message and receive AI response
- [ ] Click quick action buttons
- [ ] Click suggestion buttons in chat
- [ ] Edit pet profile and see changes
- [ ] Responsive layout on mobile/desktop
- [ ] Textarea auto-resizes
- [ ] Chat auto-scrolls to bottom
- [ ] Modal opens/closes properly
- [ ] Enter key sends message
- [ ] Shift+Enter creates new line

## Priority
High

## Estimated Time
6-8 hours

## Created
2025-10-05

## Assignee
AI Assistant

## Labels
feature, nuxt, vue, chat, ui, components

## Dependencies
- PET-2 (completed) - folder structure is ready

## Notes for Implementation
- Start with types, then utils, then composables, then components (bottom-up)
- Test each component in isolation before integrating
- Use Vue DevTools to inspect reactive state
- Check mockup HTML for exact class names and structure
- Copy SVG icons directly from mockup
- Use `v-html` carefully (only for sanitized content)
