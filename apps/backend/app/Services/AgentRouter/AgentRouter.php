<?php

namespace App\Services\AgentRouter;

use App\Agents\DefaultAssistantAgent;
use App\Agents\IntentionClassifierAgent;
use App\Services\Sse\ChatSessionContext;
use App\Support\Chat\ChatHistoryFormatter;
use App\Support\Neuron\AgentMessageContent;
use Illuminate\Support\Facades\Log;
use NeuronAI\Agent\Agent;
use NeuronAI\Chat\Messages\UserMessage;
use Throwable;

class AgentRouter
{
    public function __construct(
        private readonly ChatSessionContext $chatSession,
    ) {}

    /**
     * @param  array<int, array{content: string, sender: string}>  $chatHistory
     */
    public function route(
        string $message,
        array $chatHistory = [],
        ?string $sessionId = null,
        ?string $policyId = null,
        ?string $globalSessionId = null,
    ): AgentRouterResult {
        $sessionId = $sessionId ?? $this->newSessionId();
        $this->chatSession->setGlobalSessionId($globalSessionId);

        $classification = $this->classify($message, $chatHistory);

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

        try {
            $response = $agent->chat(new UserMessage($agentInput))->getMessage();
            $content = trim(AgentMessageContent::text($response));
        } catch (Throwable $exception) {
            Log::warning('Agent chat failed', [
                'classification' => $classification,
                'agent' => $agentClass,
                'message' => $exception->getMessage(),
                'exception' => $exception::class,
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ]);

            $content = (string) config('agents.fallback.unknown');
        }

        if ($content === '') {
            $content = (string) config('agents.fallback.unknown');
        }

        $displayClassification = $classification === 'AgentNotFoundException'
            ? DefaultAssistantAgent::CLASSIFICATION
            : $classification;

        return new AgentRouterResult(
            response: $content,
            sessionId: $sessionId,
            classification: $displayClassification,
            agentId: $displayClassification,
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
        } catch (Throwable $exception) {
            Log::warning('Intention classifier failed', [
                'message' => $exception->getMessage(),
                'exception' => $exception::class,
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ]);

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
