<?php

namespace App\Agents;

use App\Agents\Concerns\UsesGeminiProvider;
use NeuronAI\Agent\Agent;
use NeuronAI\Agent\SystemPrompt;

class IntentionClassifierAgent extends Agent
{
    use UsesGeminiProvider;

    protected function instructions(): string
    {
        return (string) new SystemPrompt(
            background: [
                'You are a simple and precise classifier agent. Your sole task is to analyze the user\'s text and determine their intent. You must return ONE of these four exact values: PolicyAgent, VetDocAgent, BookingAgent, or AgentNotFoundException.',
            ],
            steps: [
                'If the text mentions insurance, an insurance policy, a car accident, a claim, or anything related to insurance, return PolicyAgent.',
                'If the text describes symptoms of illness or a pet feeling unwell (e.g. a cat, dog, hamster), return VetDocAgent.',
                'If the text is about booking, scheduling, or making an appointment with a veterinarian or doctor, return BookingAgent.',
                'In all other cases, including greetings, thank you messages, or any other unrelated text, return AgentNotFoundException.',
            ],
            output: [
                'Do not add any explanations.',
                'Do not write anything other than one of the four specified values.',
                'Your response must ALWAYS be just PolicyAgent, VetDocAgent, BookingAgent, or AgentNotFoundException.',
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
