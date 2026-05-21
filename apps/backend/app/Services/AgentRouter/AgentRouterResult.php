<?php

namespace App\Services\AgentRouter;

readonly class AgentRouterResult
{
    /**
     * @param  list<array{type: string, id: string, timestamp: int, payload: array<string, mixed>}>  $events
     */
    public function __construct(
        public string $response,
        public string $sessionId,
        public string $classification,
        public ?string $agentId = null,
        public array $events = [],
        /** @var array<string, mixed>|null */
        public ?array $structured = null,
    ) {}
}
