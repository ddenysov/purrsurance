<template>
  <div 
    :class="[
      'flex items-center justify-center shrink-0',
      rounded,
      bgColor,
      ringColor,
      sizeClass
    ]"
  >
    <span :class="emojiSizeClass">{{ emoji }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** Size variant of the avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Emoji to display */
  emoji?: string
  /** Background color class */
  bgColor?: string
  /** Ring/border color class */
  ringColor?: string
  /** Border radius style */
  rounded?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  emoji: '🐾',
  bgColor: 'bg-mint-100',
  ringColor: 'ring-1 ring-mint-200',
  rounded: 'rounded-2xl'
})

const sizeClass = computed(() => {
  const sizes = {
    xs: 'size-6',
    sm: 'size-8',
    md: 'size-9',
    lg: 'size-10'
  }
  return sizes[props.size]
})

const emojiSizeClass = computed(() => {
  const sizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  }
  return sizes[props.size]
})
</script>
