<?php

namespace App\Agents;

use App\Agents\Concerns\UsesGeminiProvider;
use App\Agents\Tools\BookVetClinicTool;
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
                'Present clinic results clearly (name, city, specialty, phone, clinic id) and help the user pick one.',
                'Confirm all details with the user before booking: clinic, date, time, reason for visit.',
                'When the user confirms, use BookVetClinic with the clinic id from FindVetClinic, ISO 8601 appointmentDate, appointmentType, and reason.',
                'After a successful BookVetClinic response, present the confirmation number and appointment summary.',
            ],
            output: [
                'Respond in the same language the user writes in (Ukrainian, English, etc.).',
                'Be warm and efficient.',
                'Only confirm an appointment after BookVetClinic returns success: true.',
            ],
            toolsUsage: [
                'Call FindVetClinic when the user asks for clinics, location-based options, or a specialty (e.g. emergency, dental).',
                'Pass city when known (from user message or owner address in policy context). Pass specialty when the visit type is clear.',
                'For emergency or urgent cases, pass urgency="emergency" or urgency="urgent" so emergency-capable clinics are listed first.',
                'Do not invent clinic data — only use clinics returned by FindVetClinic.',
                'Call BookVetClinic only after explicit user confirmation of clinic, date/time, and reason.',
                'BookVetClinic requires policyId in the chat session — if booking fails due to missing policy, ask the user for their policy ID.',
                'Use clinicId exactly as returned by FindVetClinic (e.g. CLINIC-KV-001). Convert user date/time to ISO 8601 for appointmentDate.',
                'Do not pass pet, owner, or policyId to BookVetClinic — they are loaded automatically from the session policy.',
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
            app(BookVetClinicTool::class),
        ];
    }
}
