/**
 * Lightweight fallbacks for useChatWithApi when the remote API is unavailable.
 */
export function generateAIResponse(text: string): string {
    return `Echo: ${text}`;
}

export function generateFollowUpSuggestions(): string[] {
    return [];
}

export { containsPolicyId, extractPolicyId, POLICY_ID_PATTERN } from '@/utils/policyId';
