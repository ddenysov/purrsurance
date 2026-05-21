/** Matches POL-2025-123456 and legacy XX-1234567 style IDs. */
export const POLICY_ID_PATTERN = /\b(?:POL-\d{4}-\d{6}|[A-Z]{2,}-\d{6,8})\b/i;

export function containsPolicyId(text: string): boolean {
    return POLICY_ID_PATTERN.test(text);
}

export function extractPolicyId(text: string): string | null {
    const match = text.match(POLICY_ID_PATTERN);

    return match ? match[0].toUpperCase() : null;
}
