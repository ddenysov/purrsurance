<?php

namespace App\Services\Chat;

class ChatSessionContext
{
    public ?string $globalSessionId = null;

    public function setGlobalSessionId(?string $globalSessionId): void
    {
        $this->globalSessionId = $globalSessionId !== null && $globalSessionId !== ''
            ? $globalSessionId
            : null;
    }
}
