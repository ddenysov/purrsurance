<?php

namespace App\Agents;

use App\Agents\Concerns\UsesGeminiProvider;
use NeuronAI\Agent\Agent;
use NeuronAI\Agent\SystemPrompt;

class ConsoleChatAgent extends Agent
{
    use UsesGeminiProvider;

    protected function instructions(): string
    {
        return (string) new SystemPrompt(
            background: ['You are a helpful assistant in an interactive terminal chat.'],
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
