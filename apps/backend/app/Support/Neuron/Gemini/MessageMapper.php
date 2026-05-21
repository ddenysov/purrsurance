<?php

namespace App\Support\Neuron\Gemini;

use NeuronAI\Chat\Messages\ToolResultMessage;
use NeuronAI\Providers\Gemini\MessageMapper as BaseMessageMapper;

/**
 * Re-indexes tool result parts so JSON encodes as an array, not {"1": ...}.
 *
 * @see NeuronAI\Providers\Gemini\HandleChat When Gemini returns thought + functionCall,
 *      array_filter preserves non-zero keys on tool calls, which breaks the next request.
 */
final class MessageMapper extends BaseMessageMapper
{
    protected function mapToolsResult(ToolResultMessage $message): array
    {
        $mapped = parent::mapToolsResult($message);
        $mapped['parts'] = array_values($mapped['parts']);

        return $mapped;
    }
}
