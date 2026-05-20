<?php

namespace App\Agents;

use App\Agents\Concerns\UsesGeminiProvider;
use NeuronAI\Agent\Agent;
use NeuronAI\Agent\SystemPrompt;

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
                'Suggest realistic next steps: confirm urgency, offer to help find a clinic, summarize what you need to complete the booking.',
                'If policy ID is provided in the message, reference it when confirming details.',
            ],
            output: [
                'Be warm and efficient.',
                'Do not invent confirmed appointments — explain that booking will be finalized after the user confirms clinic and time.',
            ],
        );
    }

    /**
     * @return array{}
     */
    protected function tools(): array
    {
        return [];
    }
}
