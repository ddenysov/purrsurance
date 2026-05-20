<?php

namespace App\Support\Neuron;

use NeuronAI\Chat\History\TokenCounter;
use NeuronAI\Chat\Messages\ContentBlocks\TextContent;
use NeuronAI\Chat\Messages\ToolResultMessage;

use function is_string;
use function mb_strlen;

class SafeTokenCounter extends TokenCounter
{
    protected function handleTextBlock(TextContent $block): int
    {
        $encoded = json_encode(
            $block->toArray(),
            JSON_INVALID_UTF8_SUBSTITUTE | JSON_UNESCAPED_UNICODE,
        );

        if ($encoded === false) {
            return mb_strlen($block->getContent());
        }

        return mb_strlen($encoded);
    }

    protected function handleToolResult(ToolResultMessage $message): float
    {
        $chars = mb_strlen($message->getRole());

        foreach ($message->getTools() as $tool) {
            $result = $tool->getResult();
            $chars += mb_strlen(is_string($result) ? $result : '');

            $callId = $tool->getCallId();
            if ($callId !== null) {
                $chars += mb_strlen($callId);
            }
        }

        return $this->tokens($chars);
    }
}
