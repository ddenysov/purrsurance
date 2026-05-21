<?php

namespace App\Agents\Output;

use NeuronAI\StructuredOutput\SchemaProperty;

class PolicyAgentResponse
{
    public const SCHEMA = 'policy_agent.v1';

    public function __construct(
        #[SchemaProperty(
            description: 'User-facing reply in the same language as the user. Markdown allowed.',
            required: true,
        )]
        public string $message,
        #[SchemaProperty(
            description: 'Intent: ask_policy_id, greeting_after_lookup, policy_info, or error.',
            required: true,
        )]
        public string $intent,
        #[SchemaProperty(description: 'Policy ID when known or retrieved.', required: false)]
        public ?string $policyId = null,
        #[SchemaProperty(
            description: 'Short summary for inline UI. Fill after GetPolicyDetails with pet and policy highlights.',
            required: false,
        )]
        public ?PolicyDisplaySummary $display = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toApiArray(): array
    {
        $payload = [
            'schema' => self::SCHEMA,
            'intent' => $this->intent,
            'policyId' => $this->policyId,
        ];

        if ($this->display !== null && $this->display->petName !== '') {
            $payload['display'] = array_filter([
                'ownerName' => $this->display->ownerName,
                'petName' => $this->display->petName,
                'plan' => $this->display->plan,
                'status' => $this->display->status,
            ], fn (mixed $value): bool => $value !== null && $value !== '');
        }

        return array_filter(
            $payload,
            fn (mixed $value): bool => $value !== null && $value !== '',
        );
    }
}
