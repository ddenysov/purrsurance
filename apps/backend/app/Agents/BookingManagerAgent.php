<?php

namespace App\Agents;

use App\Agents\Concerns\UsesGeminiProvider;
use App\Agents\Tools\FindVetClinicTool;
use NeuronAI\Agent\Agent;
use NeuronAI\Agent\SystemPrompt;
use NeuronAI\Tools\ToolInterface;

class BookingManagerAgent extends Agent
{
    use UsesGeminiProvider;

    public const CLASSIFICATION = 'BookingAgent';

    protected function instructions(): string
    {
        return (string) new SystemPrompt(
            background: [
                'You are a helpful appointment booking assistant for Вет Експерт pet insurance. Your primary responsibility is to help users schedule veterinary appointments for their pets.',
            ],
            steps: [
                'Understand booking intent: type of visit, reason, preferred date and time, location preference, which pet.',
                'Ask only for information that is not already known (date, time, location, reason for visit).',
                'When the user needs clinic options or you have enough location context, use FindVetClinic to search partner clinics.',
                'Present clinic results clearly (name, city, specialty, phone) and help the user pick one.',
                'Summarize what you still need to complete the booking after a clinic is chosen (date, time, reason).',
                'If policy ID is provided in the message, reference it when confirming details.',
            ],
            output: [
                'Respond in the same language the user writes in (Ukrainian, English, etc.).',
                'Be warm and efficient.',
                'Do not invent confirmed appointments — explain that booking will be finalized after the user confirms clinic and time.',
            ],
            toolsUsage: [
                'Call FindVetClinic when the user asks for clinics, location-based options, or a specialty (e.g. emergency, dental).',
                'Pass city when known (from user message or owner address). Pass specialty when the visit type is clear.',
                'For emergency or urgent cases, pass urgency="emergency" or urgency="urgent" so emergency-capable clinics are listed first.',
                'Do not invent clinic data — only use clinics returned by FindVetClinic.',
            ],
        );
    }

    /**
     * @return array<int, ToolInterface>
     */
    protected function tools(): array
    {
        return [
            new FindVetClinicTool,
        ];
    }
}
