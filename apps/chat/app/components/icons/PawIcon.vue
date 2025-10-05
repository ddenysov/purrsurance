<template>
  <div class="relative" :class="containerClass">
    <!-- Icon Container -->
    <div 
      :class="[
        'flex items-center justify-center',
        rounded,
        bgColor,
        ringColor,
        shadowClass,
        sizeClass
      ]"
    >
      <!-- Paw SVG -->
      <svg 
        viewBox="0 0 64 64" 
        :class="iconSizeClass"
        :style="{ color: iconColor }"
        fill="currentColor" 
        aria-hidden="true"
      >
        <!-- Top left toe -->
        <circle cx="20" cy="18" r="7"/>
        <!-- Top right toe -->
        <circle cx="44" cy="18" r="7"/>
        <!-- Middle left toe -->
        <circle cx="16" cy="36" r="6"/>
        <!-- Middle right toe -->
        <circle cx="48" cy="36" r="6"/>
        <!-- Bottom pad -->
        <path d="M20 48c0-6.627 7.611-12 12-12s12 5.373 12 12-5.373 8-12 8-12-1.373-12-8z"/>
      </svg>
    </div>
    
    <!-- Online Status Indicator -->
    <span 
      v-if="showOnlineStatus"
      :class="[
        'absolute inline-flex items-center justify-center rounded-full ring-2 ring-white',
        statusSizeClass,
        statusPositionClass,
        isOnline ? 'bg-mint-500' : 'bg-gray-400'
      ]"
    ></span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** Size variant of the icon */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Whether to show online status indicator */
  showOnlineStatus?: boolean
  /** Online status (only works if showOnlineStatus is true) */
  isOnline?: boolean
  /** Background color class */
  bgColor?: string
  /** Ring/border color class */
  ringColor?: string
  /** Icon color */
  iconColor?: string
  /** Border radius style */
  rounded?: string
  /** Whether to show shadow */
  shadow?: boolean
  /** Additional container classes */
  containerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showOnlineStatus: false,
  isOnline: true,
  bgColor: 'bg-mint-50',
  ringColor: 'ring-1 ring-mint-200',
  iconColor: 'rgb(22, 154, 105)', // mint-600
  rounded: 'rounded-2xl',
  shadow: false,
  containerClass: ''
})

const sizeClass = computed(() => {
  const sizes = {
    xs: 'w-6 h-6 p-1',
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5',
    xl: 'w-14 h-14 p-3'
  }
  return sizes[props.size]
})

const iconSizeClass = computed(() => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
    xl: 'w-8 h-8'
  }
  return sizes[props.size]
})

const statusSizeClass = computed(() => {
  const sizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-4 h-4',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5'
  }
  return sizes[props.size]
})

const statusPositionClass = computed(() => {
  return '-bottom-0.5 -right-0.5'
})

const shadowClass = computed(() => {
  return props.shadow ? 'shadow-soft' : ''
})
</script>
