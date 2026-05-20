<?php

namespace App\Support\Chat;

class ChatHistoryFormatter
{
    /**
     * @param  array<int, array{content: string, sender: string}>  $chatHistory
     */
    public static function forClassifier(string $message, array $chatHistory): string
    {
        if ($chatHistory === []) {
            return $message;
        }

        $lines = [];

        foreach ($chatHistory as $entry) {
            $content = trim((string) ($entry['content'] ?? ''));
            $sender = (string) ($entry['sender'] ?? 'user');

            if ($content === '') {
                continue;
            }

            $role = $sender === 'assistant' ? 'Assistant' : 'User';
            $lines[] = "{$role}: {$content}";
        }

        if ($lines === []) {
            return $message;
        }

        return "Chat History:\n".implode("\n", $lines)
            ."\n\nBased on the above conversation, classify the user intention.\n\nUser Request:\n{$message}";
    }

    /**
     * @param  array<int, array{content: string, sender: string}>  $chatHistory
     */
    public static function forAgent(string $message, array $chatHistory, ?string $policyId = null): string
    {
        $parts = [];

        if ($policyId !== null && $policyId !== '') {
            $parts[] = "Policy ID from session: {$policyId}";
        }

        if ($chatHistory !== []) {
            $lines = [];

            foreach ($chatHistory as $entry) {
                $content = trim((string) ($entry['content'] ?? ''));
                $sender = (string) ($entry['sender'] ?? 'user');

                if ($content === '') {
                    continue;
                }

                $role = $sender === 'assistant' ? 'Assistant' : 'User';
                $lines[] = "{$role}: {$content}";
            }

            if ($lines !== []) {
                $parts[] = "Previous conversation:\n".implode("\n", $lines);
            }
        }

        $parts[] = "Current message:\n{$message}";

        return implode("\n\n", $parts);
    }
}
