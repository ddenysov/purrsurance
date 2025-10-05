# PET-4: Conditional Pet Details Display Based on Policy Upload

## Description
Implement a two-state display system for pet details. Initially, when a user first visits the app, they should NOT see pet details. Pet details should only be revealed AFTER the user sends their insurance policy information in the chat.

## Business Logic
1. **Initial State (No Details)**: When user first opens the app, the pet profile area shows a placeholder message asking to upload policy
2. **Unlocked State (With Details)**: After user mentions their policy ID or insurance policy in chat, all pet details become visible
3. **State Persistence**: The unlocked state should persist during the session (ref state, no localStorage needed)

## Technical Overview

### Components to Modify
1. **`app/composables/usePetProfile.ts`** - Add `isPolicyVerified` state and method to unlock details
2. **`app/components/pet/PetProfile.vue`** - Add conditional rendering for two states
3. **`app/utils/aiReply.ts`** - Add policy verification logic
4. **`app/composables/useChat.ts`** - Connect chat to pet profile unlocking

### State Management Flow
```
User sends message with policy → aiReply detects policy → 
useChat calls unlockPetDetails() → usePetProfile sets isPolicyVerified = true → 
PetProfile component re-renders with full details
```

---

## Implementation Steps

### Step 1: Update `app/composables/usePetProfile.ts`

**What to do:**
Add a new reactive state to track if policy has been verified.

**Code changes:**
```typescript
// Add this near the top of usePetProfile function (after existing refs)
const isPolicyVerified = ref<boolean>(false)

// Add this method before the return statement
const unlockPetDetails = () => {
  isPolicyVerified.value = true
}

// Update the return statement to include:
return {
  pet: readonly(pet),
  vaccinations: readonly(vaccinations),
  appointments: readonly(appointments),
  isPolicyVerified: readonly(isPolicyVerified), // ADD THIS
  updatePetProfile,
  addVaccination,
  updateVaccinationStatus,
  addAppointment,
  removeAppointment,
  unlockPetDetails // ADD THIS
}
```

**Important notes:**
- `isPolicyVerified` should be `false` by default
- Export it as `readonly()` so components can't modify it directly
- Only `unlockPetDetails()` method can change it to `true`

---

### Step 2: Update `app/components/pet/PetProfile.vue`

**What to do:**
Add conditional rendering to show either placeholder or full pet details.

**Code changes:**

Replace the entire `<template>` section with:
```vue
<template>
  <div class="bg-white rounded-xl shadow-soft p-6 space-y-6">
    <!-- LOCKED STATE: Show when policy not verified -->
    <div v-if="!isPolicyVerified" class="text-center py-12 space-y-4">
      <div class="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
        <!-- Lock icon SVG -->
        <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-slate-700">Pet Details Locked</h3>
        <p class="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
          To view your pet's profile and insurance details, please share your policy ID in the chat.
        </p>
        <p class="text-xs text-mint-600 mt-3 font-medium">
          Example: "My policy ID is PS-2578412"
        </p>
      </div>
    </div>

    <!-- UNLOCKED STATE: Show when policy is verified -->
    <template v-else>
      <!-- Pet Avatar and Info -->
      <div class="flex items-start space-x-4">
        <PetAvatar 
          :avatar="pet.avatar" 
          :name="pet.name"
          @edit="$emit('edit-profile')"
        />
        <PetInfo 
          :name="pet.name"
          :species="pet.species"
          :age="pet.age"
          :gender="pet.gender"
        />
      </div>
      
      <!-- Policy Cards -->
      <PetPolicyCards 
        :policy-id="pet.policyId"
        :coverage-plan="pet.coveragePlan"
      />
      
      <!-- Vaccinations -->
      <PetVaccinations :vaccinations="vaccinations" />
      
      <!-- Upcoming Appointments -->
      <PetUpcoming :appointments="appointments" />
      
      <!-- Quick Actions -->
      <PetQuickActions 
        :actions="quickActions"
        @action-click="$emit('action-click', $event)"
      />
    </template>
  </div>
</template>
```

**Update the props interface:**
```typescript
interface Props {
  pet: Pet
  vaccinations: Vaccination[]
  appointments: Appointment[]
  quickActions: QuickAction[]
  isPolicyVerified: boolean // ADD THIS NEW PROP
}
```

**Important notes:**
- Use `v-if="!isPolicyVerified"` for locked state
- Use `v-else` with `<template>` wrapper for unlocked state
- Don't change any of the unlocked state code (lines 4-34 in original)
- The locked state shows a centered message with a lock icon

---

### Step 3: Update `app/utils/aiReply.ts`

**What to do:**
Add a function to detect if user message contains a policy ID.

**Code changes:**

Add this new function at the top of the file (before `generateAIResponse`):
```typescript
/**
 * Check if user message contains a policy ID
 * Policy ID format: PS-XXXXXXX (PS- followed by 7 digits)
 */
export function containsPolicyId(message: string): boolean {
  // Check for pattern: PS- followed by numbers (case insensitive)
  const policyPattern = /PS-?\d{7}/i
  
  // Also check for keywords that indicate user is sharing policy
  const policyKeywords = ['policy id', 'policy number', 'my policy', 'insurance policy']
  
  const containsPattern = policyPattern.test(message)
  const containsKeyword = policyKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  )
  
  return containsPattern || containsKeyword
}
```

**Update the `generateAIResponse` function:**

Add this NEW condition at the TOP of the function (before all other if statements):
```typescript
// Policy ID verification
if (containsPolicyId(message)) {
  return `Thank you! I've verified your policy ID. I can now see your pet's complete profile and insurance details. How can I help you today?`
}
```

**Important notes:**
- Place this check FIRST, before other conditions
- Policy ID format is: `PS-2578412` (PS followed by 7 digits)
- Accept with or without hyphen: `PS2578412` or `PS-2578412`
- Case insensitive: `ps-2578412` should also work

---

### Step 4: Update `app/composables/useChat.ts`

**What to do:**
Make the chat composable aware of pet profile unlocking.

**Code changes:**

Modify the `sendMessage` function to check for policy and unlock pet details:

**Find this section in `sendMessage`:**
```typescript
// Add user message
addMessage(userMessage)

// Show typing indicator
isTyping.value = true
```

**Replace it with:**
```typescript
// Add user message
addMessage(userMessage)

// Check if message contains policy ID and unlock pet details
// Import at top: import { containsPolicyId } from '~/utils/aiReply'
if (containsPolicyId(text)) {
  // Get access to pet profile composable
  const { unlockPetDetails } = usePetProfile()
  unlockPetDetails()
}

// Show typing indicator
isTyping.value = true
```

**Add import at the top:**
```typescript
import { generateAIResponse, containsPolicyId } from '~/utils/aiReply'
import { usePetProfile } from './usePetProfile'
```

**Important notes:**
- Call `containsPolicyId()` to check if message has policy
- If true, call `unlockPetDetails()` from `usePetProfile()`
- This should happen BEFORE generating AI response
- The unlock happens immediately when message is sent

---

### Step 5: Update `app/pages/index.vue`

**What to do:**
Pass the `isPolicyVerified` prop to the PetProfile component.

**Code changes:**

**Find the PetProfile component usage:**
```vue
<PetProfile 
  :pet="pet"
  :vaccinations="vaccinations"
  :appointments="appointments"
  :quick-actions="quickActions"
  @edit-profile="openModal"
  @action-click="handleQuickAction"
/>
```

**Update it to:**
```vue
<PetProfile 
  :pet="pet"
  :vaccinations="vaccinations"
  :appointments="appointments"
  :quick-actions="quickActions"
  :is-policy-verified="isPolicyVerified"
  @edit-profile="openModal"
  @action-click="handleQuickAction"
/>
```

**In the script section, destructure `isPolicyVerified`:**

**Find this line:**
```typescript
const { pet, vaccinations, appointments, updatePetProfile } = usePetProfile()
```

**Update it to:**
```typescript
const { pet, vaccinations, appointments, isPolicyVerified, updatePetProfile } = usePetProfile()
```

**Important notes:**
- Add `:is-policy-verified="isPolicyVerified"` prop binding
- Destructure `isPolicyVerified` from `usePetProfile()`
- No other changes needed in this file

---

## Testing Checklist

After implementation, test these scenarios:

- [ ] **Initial Load**: Open app → Pet details should be HIDDEN, locked state visible
- [ ] **Locked State Display**: Verify lock icon and message "Pet Details Locked" appears
- [ ] **Policy ID Detection**: Send "My policy ID is PS-2578412" in chat
- [ ] **Details Unlock**: After sending policy, pet details should appear immediately
- [ ] **AI Response**: AI should respond with "Thank you! I've verified your policy ID..."
- [ ] **State Persistence**: Pet details remain visible after unlocking (don't hide again)
- [ ] **Policy Variations**: Test with different formats:
  - "PS-2578412" ✓
  - "PS2578412" ✓
  - "ps-2578412" ✓
  - "My policy number is PS-2578412" ✓
- [ ] **Regular Messages**: Send regular messages before policy → details stay locked
- [ ] **Quick Actions**: Quick action buttons should only work when details unlocked
- [ ] **Edit Profile**: Edit button should not appear in locked state
- [ ] **Mobile View**: Test locked/unlocked states on mobile layout
- [ ] **No Console Errors**: Check browser console for any errors

---

## Acceptance Criteria

- [ ] Pet details are HIDDEN by default when app loads
- [ ] Locked state shows user-friendly placeholder with instructions
- [ ] When user sends message with policy ID, details unlock automatically
- [ ] AI detects various formats of policy IDs (with/without hyphen, any case)
- [ ] Pet details remain unlocked after first policy verification
- [ ] No TypeScript errors or linter warnings
- [ ] All existing functionality still works (chat, quick actions, etc.)
- [ ] Code follows existing patterns and conventions
- [ ] Comments are added to explain the policy verification logic
- [ ] Locked state is visually appealing (not just empty space)

---

## Important Notes for AI Agent

### DO:
✅ Follow the exact code structure shown in steps above
✅ Add `isPolicyVerified` as a new boolean ref (default: false)
✅ Use `v-if` and `v-else` for conditional rendering
✅ Import `containsPolicyId` function in useChat.ts
✅ Place policy check BEFORE AI response generation
✅ Use `readonly()` when returning state from composable
✅ Test with multiple policy ID formats

### DON'T:
❌ Don't add localStorage or persistence (just session state)
❌ Don't modify the unlocked state UI (keep it exactly as is)
❌ Don't change the policy ID format (must be PS-XXXXXXX)
❌ Don't add authentication or real verification (just pattern matching)
❌ Don't modify other composables besides usePetProfile and useChat
❌ Don't change the visual design (use provided locked state template)
❌ Don't add extra features not mentioned in this task

### Pattern Matching Logic:
The policy verification is simple pattern matching for demo purposes:
- Regex: `/PS-?\d{7}/i` matches PS followed by 7 digits (hyphen optional)
- Keywords: "policy id", "policy number", "my policy", "insurance policy"
- Case insensitive: PS, ps, Ps all work

### State Flow:
```
1. App loads → isPolicyVerified = false → Locked state shown
2. User types message with policy → containsPolicyId() = true
3. useChat calls unlockPetDetails() → isPolicyVerified = true
4. PetProfile re-renders → Unlocked state shown
5. State remains true for rest of session
```

---

## Priority
High

## Estimated Time
2-3 hours

## Created
2025-10-05

## Assignee
AI Agent

## Labels
feature, security, conditional-rendering, state-management

## Dependencies
- PET-3 (completed) - requires existing chat and pet profile components

## Files to Modify
1. `apps/chat/app/composables/usePetProfile.ts`
2. `apps/chat/app/components/pet/PetProfile.vue`
3. `apps/chat/app/utils/aiReply.ts`
4. `apps/chat/app/composables/useChat.ts`
5. `apps/chat/app/pages/index.vue`

## Testing Commands
```bash
# Run dev server
cd apps/chat
pnpm dev

# Open browser to http://localhost:3000
# Test scenarios listed in Testing Checklist
```

---

## Success Criteria Summary

**Before implementing, AI agent should understand:**
1. Initial state = locked (no details visible)
2. Trigger = user sends message with policy ID
3. Action = unlock pet details permanently (for session)
4. Result = all pet info becomes visible

**After implementing, user should see:**
1. Clean locked state on first visit
2. Smooth transition to unlocked state after policy message
3. All existing features work normally after unlock
4. No bugs or console errors
