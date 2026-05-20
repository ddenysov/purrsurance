<?php

namespace App\Services\AgentRouter;

use App\Agents\IntentionClassifierAgent;
use App\Support\Chat\ChatHistoryFormatter;
use NeuronAI\Agent\Agent;
use NeuronAI\Chat\Messages\UserMessage;
use Throwable;

class AgentRouter
{
    /**
     * @param  array<int, array{content: string, sender: string}>  $chatHistory
     */
    public function route(
        string $message,
        array $chatHistory = [],
        ?string $sessionId = null,
        ?string $policyId = null,
    ): AgentRouterResult {
        $sessionId = $sessionId ?? $this->newSessionId();

        $classification = $this->classify($message, $chatHistory);

        if ($classification === 'AgentNotFoundException') {
            return new AgentRouterResult(
                response: (string) config('agents.fallback.not_found'),
                sessionId: $sessionId,
                classification: $classification,
            );
        }

        $agentClass = config("agents.mapping.{$classification}");

        if (! is_string($agentClass) || ! class_exists($agentClass)) {
            return new AgentRouterResult(
                response: (string) config('agents.fallback.unknown'),
                sessionId: $sessionId,
                classification: $classification,
            );
        }

        /** @var Agent $agent */
        $agent = app($agentClass);

        $agentInput = ChatHistoryFormatter::forAgent($message, $chatHistory, $policyId);

        $response = $agent->chat(new UserMessage($agentInput))->getMessage();
        $content = trim($response->getContent() ?? '');

        if ($content === '') {
            $content = (string) config('agents.fallback.unknown');
        }

        return new AgentRouterResult(
            response: $content,
            sessionId: $sessionId,
            classification: $classification,
            agentId: $classification,
        );
    }

    /**
     * @param  array<int, array{content: string, sender: string}>  $chatHistory
     */
    public function classify(string $message, array $chatHistory = []): string
    {
        $classifier = new IntentionClassifierAgent;
        $input = ChatHistoryFormatter::forClassifier($message, $chatHistory);

        try {
            $response = $classifier->chat(new UserMessage($input))->getMessage();
            $raw = trim($response->getContent() ?? '');
        } catch (Throwable) {
            return 'AgentNotFoundException';
        }

        /** @var list<string> $allowed */
        $allowed = (array) config('agents.classifications', []);

        foreach ($allowed as $value) {
            if (strcasecmp($raw, $value) === 0) {
                return $value;
            }
        }

        if (preg_match('/\b(PolicyAgent|VetDocAgent|BookingAgent|AgentNotFoundException)\b/i', $raw, $matches)) {
            $matched = $matches[1];
            foreach ($allowed as $value) {
                if (strcasecmp($matched, $value) === 0) {
                    return $value;
                }
            }
        }

        return 'AgentNotFoundException';
    }

    private function newSessionId(): string
    {
        return 'session-'.now()->getTimestampMs().'-'.substr(uniqid('', true), -7);
    }
}
