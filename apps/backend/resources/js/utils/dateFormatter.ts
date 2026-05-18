const UK_LOCALE = 'uk-UA'

/**
 * Format date for display in the UI
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  return d.toLocaleDateString(UK_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Format time for display in the UI
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  return d.toLocaleTimeString(UK_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Format date and time together
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)}, ${formatTime(date)}`
}

/**
 * Get relative time (e.g., "2 hours ago", "yesterday")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInMs = now.getTime() - d.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  
  if (diffInMinutes < 1) {
    return 'Щойно'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} хв тому`
  } else if (diffInHours < 24) {
    return `${diffInHours} год тому`
  } else if (diffInDays === 1) {
    return 'Учора'
  } else if (diffInDays < 7) {
    return `${diffInDays} дн тому`
  } else {
    return formatDate(d)
  }
}
