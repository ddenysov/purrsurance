<?php

namespace App\Services\AgentRouter;

use App\Agents\DefaultAssistantAgent;
use App\Agents\IntentionClassifierAgent;
use App\Services\Chat\ChatSessionContext;
use App\Services\Chat\SessionEventCollector;
use App\Support\Chat\ChatHistoryFormatter;
use App\Support\Neuron\AgentMessageContent;
use App\Support\Neuron\StructuredAgentResult;
use Illuminate\Support\Facades\Log;
use NeuronAI\Agent\Agent;
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

        if (! is_string($agentClass) || ! class_exists($agentClass)) {
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

        $structured = null;

        try {
            [$content, $structured] = $this->runAgent($agent, $agentClass, $agentInput);
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
            events: $this->eventCollector->all(),
            structured: $structured,
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

    /**
     * @return array{0: string, 1: array<string, mixed>|null}
     */
    private function runAgent(Agent $agent, string $agentClass, string $agentInput): array
    {
        /** @var array<string, class-string> $structuredAgents */
        $structuredAgents = (array) config('agents.structured', []);

        if (isset($structuredAgents[$agentClass])) {
            try {
                $output = $agent->structured(new UserMessage($agentInput), maxRetries: 2);
                $parsed = StructuredAgentResult::fromOutput($output);

                if ($parsed['content'] !== '') {
                    return [$parsed['content'], $parsed['structured']];
                }
            } catch (Throwable $exception) {
                Log::warning('Agent structured output failed, falling back to chat', [
                    'agent' => $agentClass,
                    'message' => $exception->getMessage(),
                    'exception' => $exception::class,
                ]);
            }
        }

        $response = $agent->chat(new UserMessage($agentInput))->getMessage();

        return [trim(AgentMessageContent::text($response)), null];
    }

    private function newSessionId(): string
    {
        return 'session-'.now()->getTimestampMs().'-'.substr(uniqid('', true), -7);
    }
}
