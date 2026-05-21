<?php

namespace App\Agents\Concerns;

use App\Support\Neuron\GeminiFactory;
use NeuronAI\Providers\AIProviderInterface;

trait UsesGeminiProvider
{
    protected function provider(): AIProviderInterface
    {
        return GeminiFactory::provider();
    }
}
