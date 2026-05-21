<?php

namespace App\Support\Neuron;

use NeuronAI\Chat\Messages\Message;

final class AgentMessageContent
{
    /**
     * Visible assistant text, including thinking-model reasoning when no plain text was returned.
     */
    public static function text(Message $message): string
    {
        $content = trim($message->getContent() ?? '');

        if ($content !== '') {
            return $content;
        }

        $reasoning = $message->getReasoning();

        if ($reasoning !== null) {
            return trim($reasoning->content);
        }

        return '';
    }
}
