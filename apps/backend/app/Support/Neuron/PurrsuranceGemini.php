<?php

namespace App\Support\Neuron;

use App\Support\Neuron\Gemini\MessageMapper;
use NeuronAI\Chat\Messages\ToolCallMessage;
use NeuronAI\Providers\Gemini\Gemini;
use NeuronAI\Providers\MessageMapperInterface;

class PurrsuranceGemini extends Gemini
{
    public function messageMapper(): MessageMapperInterface
    {
        return $this->messageMapper ??= new MessageMapper;
    }

    /**
     * @param  array<int, array<string, mixed>>  $toolCalls
     */
    protected function createToolCallMessage(array $blocks, array $toolCalls): ToolCallMessage
    {
        return parent::createToolCallMessage($blocks, array_values($toolCalls));
    }
}
