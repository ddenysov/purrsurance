export type PolicyAgentIntent =
    | 'ask_policy_id'
    | 'greeting_after_lookup'
    | 'policy_info'
    | 'error';

export interface PolicyDisplaySummary {
    ownerName?: string;
    petName: string;
    plan?: string;
    status?: string;
}

export interface PolicyAgentStructured {
    schema: 'policy_agent.v1';
    intent: PolicyAgentIntent | string;
    policyId?: string;
    display?: PolicyDisplaySummary;
}

export function isPolicyAgentStructured(value: unknown): value is PolicyAgentStructured {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const candidate = value as PolicyAgentStructured;

    return candidate.schema === 'policy_agent.v1';
}
