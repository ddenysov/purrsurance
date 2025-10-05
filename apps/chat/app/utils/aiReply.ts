import type { ChatMessage } from '~/types'

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

/**
 * Generate AI response based on user input
 * Simple pattern matching for demo purposes
 */
export function generateAIResponse(userMessage: string): string {
  const message = userMessage.toLowerCase()
  
  // Policy ID verification
  if (containsPolicyId(userMessage)) {
    return `Thank you! I've verified your policy ID. I can now see your pet's complete profile and insurance details. How can I help you today?`
  }
  
  // Policy-related queries
  if (message.includes('policy') || message.includes('coverage') || message.includes('plan')) {
    return `I can help you with your pet insurance policy! Your current plan covers 80% of eligible veterinary expenses. Would you like to know more about your coverage details or make any changes to your policy?`
  }
  
  // Veterinary-related queries
  if (message.includes('vet') || message.includes('veterinarian') || message.includes('doctor')) {
    return `I can help you find a veterinarian in your network or schedule an appointment. Your policy covers visits to any licensed veterinarian. Would you like me to help you find a vet near you or check your upcoming appointments?`
  }
  
  // Pharmacy-related queries
  if (message.includes('pharmacy') || message.includes('medication') || message.includes('prescription')) {
    return `I can help you with prescription medications for your pet. Your policy covers prescription medications when prescribed by a licensed veterinarian. Would you like to find a participating pharmacy or check medication coverage?`
  }
  
  // Claims-related queries
  if (message.includes('claim') || message.includes('reimbursement') || message.includes('submit')) {
    return `I can help you submit a claim or check the status of an existing claim. You can submit claims through our mobile app or online portal. Would you like me to guide you through the claims process?`
  }
  
  // Emergency-related queries
  if (message.includes('emergency') || message.includes('urgent') || message.includes('help')) {
    return `For pet emergencies, please contact your nearest emergency veterinary clinic immediately. Your policy covers emergency visits, and I can help you find the nearest covered emergency clinic. Is this an emergency situation?`
  }
  
  // General greeting
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return `Hi! I’m your Purrsurance assistant. Tell me your policy ID or ask a question — for example, “Find a vet for vomiting and lethargy near me”.`
  }
  
  // Default response
  return `I understand you're asking about "${userMessage}". I'm here to help with your pet insurance needs. Could you be more specific about what you'd like to know? I can help with policy information, finding veterinarians, submitting claims, or answering questions about your coverage.`
}

/**
 * Generate follow-up suggestions based on the AI response
 */
export function generateFollowUpSuggestions(aiResponse: string): string[] {
  const suggestions: string[] = []
  
  if (aiResponse.includes('policy') || aiResponse.includes('coverage')) {
    suggestions.push('What does my policy cover?', 'How do I update my coverage?', 'What are my policy limits?')
  } else if (aiResponse.includes('vet') || aiResponse.includes('veterinarian')) {
    suggestions.push('Find a vet near me', 'Schedule an appointment', 'Check my upcoming appointments')
  } else if (aiResponse.includes('claim')) {
    suggestions.push('Submit a new claim', 'Check claim status', 'Upload claim documents')
  } else {
    suggestions.push('Tell me about my policy', 'Find a veterinarian', 'Submit a claim')
  }
  
  return suggestions.slice(0, 3) // Return max 3 suggestions
}
