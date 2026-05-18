/**
 * Sanitize HTML content to prevent XSS attacks
 * Simple implementation that removes potentially dangerous tags
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove javascript: protocols
  sanitized = sanitized.replace(/javascript:/gi, '')
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
  
  // Remove potentially dangerous attributes
  sanitized = sanitized.replace(/\s(style|onload|onerror|onclick|onmouseover)\s*=\s*["'][^"']*["']/gi, '')
  
  return sanitized
}

/**
 * Sanitize plain text input
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocols
    .trim()
}
