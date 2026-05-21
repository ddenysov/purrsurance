<?php

namespace App\Agents\Tools;

use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\Tool;
use NeuronAI\Tools\ToolProperty;

class RecommendDoctorVisitTool extends Tool
{
    public function __construct()
    {
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
                description: 'Clear, concise reason for the visit (e.g. "Persistent vomiting and lethargy for 24+ hours").',
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

        return json_encode([
            'status' => 'recorded',
            'recommendation' => [
                'type' => 'doctor_visit',
                'reason' => $reason,
                'urgency' => $urgency,
                'symptoms' => $symptoms,
                'timestamp' => now()->toIso8601String(),
                'message' => "We recommend scheduling a vet visit. Reason: {$reason}",
            ],
            'nextSteps' => [
                'Contact your veterinarian to schedule an appointment',
                'Prepare information about symptoms and pet behavior',
                'Bring your pet\'s medical records if available',
            ],
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    }
}
