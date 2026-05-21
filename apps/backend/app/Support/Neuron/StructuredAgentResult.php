<?php

namespace App\Support\Neuron;

use App\Agents\Output\PolicyAgentResponse;

final class StructuredAgentResult
{
    /**
     * @return array{content: string, structured: array<string, mixed>|null}
     */
    public static function fromOutput(object $output): array
    {
        if ($output instanceof PolicyAgentResponse) {
            $message = trim($output->message);

            return [
                'content' => $message !== '' ? $message : '',
                'structured' => $output->toApiArray(),
            ];
        }

        return [
            'content' => '',
            'structured' => null,
        ];
    }
}
