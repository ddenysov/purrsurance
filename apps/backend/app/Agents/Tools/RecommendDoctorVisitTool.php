<?php

namespace App\Agents\Tools;

use App\Services\Sse\ChatSessionContext;
use App\Services\Sse\SessionEventPublisher;
use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\Tool;
use NeuronAI\Tools\ToolProperty;

class RecommendDoctorVisitTool extends Tool
{
    public function __construct(
        private readonly SessionEventPublisher $eventPublisher,
        private readonly ChatSessionContext $chatSession,
    ) {
        parent::__construct(
            name: 'RecommendDoctorVisit',
            description: 'Records an official recommendation for the pet owner to visit a veterinarian.',
        );
    }

    /**
     * @return ToolProperty[]
     */
    protected function properties(): array
    {
        return [
            ToolProperty::make(
                name: 'reason',
                type: PropertyType::STRING,
                description: 'User-facing recommendation in the owner\'s language (e.g. Ukrainian: "Рекомендуємо візит до ветеринара: тривала блювота понад 24 години").',
                required: true,
            ),
            ToolProperty::make(
                name: 'urgency',
                type: PropertyType::STRING,
                description: 'Urgency level: emergency (immediate), urgent (within 24h), normal (schedule when convenient), routine (checkup).',
                required: false,
                enum: ['emergency', 'urgent', 'normal', 'routine'],
            ),
            ToolProperty::make(
                name: 'symptoms',
                type: PropertyType::STRING,
                description: 'Comma-separated list of key symptoms (e.g. "vomiting, lethargy, reduced appetite").',
                required: false,
            ),
        ];
    }

    public function __invoke(?string $reason, ?string $urgency = null, ?string $symptoms = null): string
    {
        $reason = trim((string) $reason);

        if ($reason === '') {
            return json_encode([
                'error' => 'Missing required parameter: reason',
                'message' => 'Please provide a clear reason for recommending the visit.',
            ], JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE);
        }

        $urgency = $urgency !== null && $urgency !== '' ? trim($urgency) : 'normal';
        $symptoms = $symptoms !== null && $symptoms !== '' ? trim($symptoms) : '';

        $payload = [
            'status' => 'recorded',
            'recommendation' => [
                'type' => 'doctor_visit',
                'reason' => $reason,
                'urgency' => $urgency,
                'symptoms' => $symptoms,
                'timestamp' => now()->toIso8601String(),
                'message' => $reason,
            ],
            'nextSteps' => [
                'Contact your veterinarian to schedule an appointment',
                'Prepare information about symptoms and pet behavior',
                'Bring your pet\'s medical records if available',
            ],
        ];

        if ($this->chatSession->globalSessionId !== null) {
            $this->eventPublisher->publishRecommendDoctorVisit(
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
