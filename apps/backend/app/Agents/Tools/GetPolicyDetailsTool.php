<?php

namespace App\Agents\Tools;

use App\Models\Policy;
use App\Services\Chat\ChatSessionContext;
use App\Services\Chat\SessionEventPublisher;
use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\Tool;
use NeuronAI\Tools\ToolProperty;

class GetPolicyDetailsTool extends Tool
{
    public function __construct(
        private readonly SessionEventPublisher $eventPublisher,
        private readonly ChatSessionContext $chatSession,
    ) {
        parent::__construct(
            name: 'GetPolicyDetails',
            description: 'Retrieves detailed information about an insurance policy by policy ID.',
        );
    }

    /**
     * @return ToolProperty[]
     */
    protected function properties(): array
    {
        return [
            ToolProperty::make(
                name: 'policyId',
                type: PropertyType::STRING,
                description: 'The unique identifier for the insurance policy (e.g. POL-2025-123456).',
                required: true,
            ),
        ];
    }

    public function __invoke(string $policyId): string
    {
        $policyId = trim($policyId);

        if ($policyId === '') {
            return json_encode([
                'error' => 'Missing required parameter: policyId',
                'message' => 'Please provide a valid policy ID',
            ], JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE);
        }

        $policy = Policy::query()->find($policyId);

        if ($policy === null) {
            return json_encode([
                'error' => 'Policy not found',
                'message' => "No policy found with ID: {$policyId}",
            ], JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE);
        }

        $vetContacts = [];
        $lastCheckupClinic = $policy->medical['lastCheckup']['clinic'] ?? null;
        if ($lastCheckupClinic !== null) {
            $vetContacts[] = $lastCheckupClinic;
        }

        $payload = [
            'pet' => $policy->pet,
            'owner' => $policy->owner,
            'policy' => $policy->policy_details,
            'medical' => $policy->medical,
            'claims' => [],
            'vetContacts' => $vetContacts,
            'audit' => [
                'createdAt' => $policy->created_at?->toIso8601String(),
                'updatedAt' => $policy->updated_at?->toIso8601String(),
                'source' => 'database',
                'version' => 1,
            ],
        ];

        if ($this->chatSession->globalSessionId !== null) {
            $this->eventPublisher->publishPolicyDetailsRetrieved(
                $this->chatSession->globalSessionId,
                $payload,
            );
        }

        return json_encode(
            $payload,
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE,
        );
    }
}
