import MarkdownIt from 'markdown-it'

/**
 * Initialize markdown-it with safe defaults
 * Configured for security and readability
 */
const md = new MarkdownIt({
  html: true,
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
