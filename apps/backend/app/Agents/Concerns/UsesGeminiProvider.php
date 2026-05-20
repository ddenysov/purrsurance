<?php

namespace App\Agents\Concerns;

use NeuronAI\Providers\AIProviderInterface;
use NeuronAI\Providers\Gemini\Gemini;

trait UsesGeminiProvider
{
    protected function provider(): AIProviderInterface
    {
        return new Gemini(
            key: (string) config('gemini.api_key'),
            model: (string) config('gemini.model'),
        );
    }
}
