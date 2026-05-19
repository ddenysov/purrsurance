<?php

namespace App\Agents;

use NeuronAI\Agent\Agent;
use NeuronAI\Agent\SystemPrompt;
use NeuronAI\Providers\AIProviderInterface;
use NeuronAI\Providers\Gemini\Gemini;

class ConsoleChatAgent extends Agent
{
    protected function provider(): AIProviderInterface
    {
        return new Gemini(
            key: (string) config('gemini.api_key'),
            model: (string) config('gemini.model'),
        );
    }

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
