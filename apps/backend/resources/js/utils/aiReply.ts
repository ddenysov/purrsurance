/**
 * Lightweight fallbacks for useChatWithApi when the remote API is unavailable.
 */
export function generateAIResponse(text: string): string {
    return `Echo: ${text}`;
}

export function generateFollowUpSuggestions(): string[] {
    return [];
}

export function containsPolicyId(text: string): boolean {
    const policyIdPattern = /\b[A-Z]{2}-?\d{6,8}\b/i;

    return policyIdPattern.test(text);
}
