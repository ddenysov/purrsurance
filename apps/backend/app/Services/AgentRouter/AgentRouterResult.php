<?php

namespace App\Services\AgentRouter;

readonly class AgentRouterResult
{
    public function __construct(
        public string $response,
        public string $sessionId,
        public string $classification,
        public ?string $agentId = null,
    ) {}
}
