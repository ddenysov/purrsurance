<?php

namespace App\Services\AgentRouter;

use App\Agents\DefaultAssistantAgent;
use App\Agents\IntentionClassifierAgent;
use App\Services\Chat\ChatSessionContext;
use App\Services\Chat\SessionEventCollector;
use App\Support\Chat\ChatHistoryFormatter;
use App\Support\Neuron\AgentMessageContent;
use Illuminate\Support\Facades\Log;
use NeuronAI\Agent\Agent;
use NeuronAI\Agent\AgentState;
use NeuronAI\Chat\Messages\UserMessage;
use Throwable;

class AgentRouter
{
    public function __construct(
        private readonly ChatSessionContext $chatSession,
        private readonly SessionEventCollector $eventCollector,
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

        Log::info('Agent routing decision', [
            'sessionId' => $sessionId,
            'globalSessionId' => $globalSessionId,
            'policyId' => $policyId,
            'classification' => $classification,
            'agent' => is_string($agentClass) ? $agentClass : null,
        ]);

        if (! is_string($agentClass) || ! class_exists($agentClass)) {
            Log::info('Agent routing fallback', [
                'sessionId' => $sessionId,
                'classification' => $classification,
                'reason' => ! is_string($agentClass) ? 'no_mapping' : 'class_not_found',
            ]);

            return new AgentRouterResult(
                response: (string) config('agents.fallback.unknown'),
                sessionId: $sessionId,
                classification: $classification,
                events: $this->eventCollector->all(),
            );
        }

        /** @var Agent $agent */
        $agent = app($agentClass);

        $agentInput = ChatHistoryFormatter::forAgent($message, $chatHistory, $policyId);

        try {
            /** @var AgentState $state */
            $state = $agent->chat(new UserMessage($agentInput))->run();
            $content = AgentMessageContent::displayText($state);
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

        Log::info('Agent routing completed', [
            'sessionId' => $sessionId,
            'classification' => $displayClassification,
            'agent' => $agentClass,
            'responseLength' => strlen($content),
        ]);

        return new AgentRouterResult(
            response: $content,
            sessionId: $sessionId,
            classification: $displayClassification,
            agentId: $displayClassification,
            events: $this->eventCollector->all(),
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
                Log::info('Agent classification', ['raw' => $raw, 'classification' => $value]);

                return $value;
            }
        }

        if (preg_match('/\b(PolicyAgent|VetDocAgent|BookingAgent|AgentNotFoundException)\b/i', $raw, $matches)) {
            $matched = $matches[1];
            foreach ($allowed as $value) {
                if (strcasecmp($matched, $value) === 0) {
                    Log::info('Agent classification', ['raw' => $raw, 'classification' => $value, 'matched' => $matched]);

                    return $value;
                }
            }
        }

        Log::info('Agent classification', ['raw' => $raw, 'classification' => 'AgentNotFoundException']);

        return 'AgentNotFoundException';
    }

    private function newSessionId(): string
    {
        return 'session-'.now()->getTimestampMs().'-'.substr(uniqid('', true), -7);
    }
}
