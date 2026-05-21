<?php

namespace App\Support\Neuron;

use NeuronAI\Agent\AgentState;
use NeuronAI\Chat\Messages\Message;
use NeuronAI\Chat\Messages\ToolCallMessage;
use NeuronAI\Chat\Messages\ToolResultMessage;

final class AgentMessageContent
{
    /**
     * User-facing text for an agent run. When a tool was called, prefer the pre-tool
     * assessment (ToolCallMessage) over the short post-tool follow-up.
     */
    public static function displayText(AgentState $state): string
    {
        $toolCallText = null;
        $hadToolResult = false;

        foreach ($state->getChatHistory()->getMessages() as $message) {
            if ($message instanceof ToolCallMessage) {
                $text = trim(self::text($message));

                if ($text !== '') {
                    $toolCallText = $text;
                }
            } elseif ($message instanceof ToolResultMessage) {
                $hadToolResult = true;
            }
        }

        $last = $state->getMessage();

        if (
            $toolCallText !== null
            && $hadToolResult
            && ! $last instanceof ToolCallMessage
            && ! $last instanceof ToolResultMessage
        ) {
            return $toolCallText;
        }

        return trim(self::text($last));
    }

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
