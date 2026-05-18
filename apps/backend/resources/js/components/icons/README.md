# Icon Components

This folder contains icon components for the Вет Експерт application, matching the design from the mockup.

## Components

1. **PawIcon** - SVG-based paw icon for headers and main navigation
2. **AssistantAvatar** - Emoji-based avatar for chat messages

---

## PawIcon Component

A customizable paw icon component for the Вет Експерт application, matching the design from the mockup.

## Features

- SVG-based paw icon with 5 elements (4 toe pads + 1 main pad)
- Customizable size variants
- Optional online status indicator
- Flexible styling options (colors, shadows, borders)
- Fully typed with TypeScript

## Usage

### Basic Usage

```vue
<template>
  <PawIcon />
</template>

<script setup>
import PawIcon from '@/components/icons/PawIcon.vue'
</script>
```

### With Size Variants

```vue
<PawIcon size="xs" />  <!-- 6x6 container -->
<PawIcon size="sm" />  <!-- 8x8 container -->
<PawIcon size="md" />  <!-- 10x10 container (default) -->
<PawIcon size="lg" />  <!-- 12x12 container -->
<PawIcon size="xl" />  <!-- 14x14 container -->
```

### With Online Status Indicator

```vue
<PawIcon 
  :show-online-status="true"
  :is-online="true"
/>
```

### With Custom Styling

```vue
<PawIcon 
  bg-color="bg-brand-50"
  ring-color="ring-1 ring-brand-200"
  icon-color="rgb(219, 39, 119)"
  rounded="rounded-full"
  :shadow="true"
/>
```

### In Header (Current Usage)

```vue
<!-- AppHeader.vue -->
<PawIcon 
  size="lg"
  :shadow="true"
/>
```

### In Chat Header (Current Usage)

```vue
<!-- ChatHeader.vue -->
<PawIcon 
  size="md"
  :show-online-status="true"
  :is-online="true"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Size variant of the icon |
| `showOnlineStatus` | `boolean` | `false` | Whether to show online status indicator |
| `isOnline` | `boolean` | `true` | Online status (only works if showOnlineStatus is true) |
| `bgColor` | `string` | `'bg-mint-50'` | Background color Tailwind class |
| `ringColor` | `string` | `'ring-1 ring-mint-200'` | Ring/border color Tailwind classes |
| `iconColor` | `string` | `'rgb(22, 154, 105)'` | Icon color (mint-600) |
| `rounded` | `string` | `'rounded-2xl'` | Border radius Tailwind class |
| `shadow` | `boolean` | `false` | Whether to show shadow |
| `containerClass` | `string` | `''` | Additional container classes |

## Design Notes

The icon matches the design from the mockup file at `/mockups/v2/index.html`:
- Lines 81-87: Header logo
- Lines 187-193: Chat assistant icon

The SVG uses a viewBox of "0 0 64 64" with:
- 4 circles representing toe pads
- 1 path element representing the main pad

---

## AssistantAvatar Component

A simple emoji-based avatar component for assistant messages in the chat, matching the design from the mockup.

### Features

- Emoji-based avatar (🐾 by default)
- Multiple size variants
- Customizable colors and styling
- Lightweight and simple

### Usage

#### Basic Usage

```vue
<template>
  <AssistantAvatar />
</template>

<script setup>
import AssistantAvatar from '@/components/chat/AssistantAvatar.vue'
</script>
```

#### With Size Variants

```vue
<AssistantAvatar size="xs" />  <!-- 6x6 container -->
<AssistantAvatar size="sm" />  <!-- 8x8 container (default) -->
<AssistantAvatar size="md" />  <!-- 9x9 container -->
<AssistantAvatar size="lg" />  <!-- 10x10 container -->
```

#### With Custom Emoji

```vue
<AssistantAvatar 
  emoji="🐱"
  bg-color="bg-brand-50"
  ring-color="ring-1 ring-brand-200"
/>
```

#### Current Usage

```vue
<!-- ChatMessage.vue -->
<AssistantAvatar 
  v-if="message.sender === 'assistant'"
  size="sm"
/>

<!-- ChatTypingIndicator.vue -->
<AssistantAvatar size="sm" />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Size variant of the avatar |
| `emoji` | `string` | `'🐾'` | Emoji to display |
| `bgColor` | `string` | `'bg-mint-100'` | Background color Tailwind class |
| `ringColor` | `string` | `'ring-1 ring-mint-200'` | Ring/border color Tailwind classes |
| `rounded` | `string` | `'rounded-2xl'` | Border radius Tailwind class |

### Design Notes

The component matches the design from the mockup file at `/mockups/v2/index.html`:
- Line 209-210: Chat message avatar with emoji 🐾
- Line 330: Typing indicator avatar

Uses a simple emoji approach for chat messages instead of the more complex SVG icon.
