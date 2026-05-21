<?php

namespace App\Services\Chat;

class ChatSessionContext
{
    public ?string $globalSessionId = null;

    public ?string $policyId = null;

    public ?string $sessionId = null;

    public function setGlobalSessionId(?string $globalSessionId): void
    {
        $this->globalSessionId = $globalSessionId !== null && $globalSessionId !== ''
            ? $globalSessionId
            : null;
    }

    public function setPolicyId(?string $policyId): void
    {
        $this->policyId = $policyId !== null && $policyId !== ''
            ? $policyId
            : null;
    }

    public function setSessionId(?string $sessionId): void
    {
        $this->sessionId = $sessionId !== null && $sessionId !== ''
            ? $sessionId
            : null;
    }
}
