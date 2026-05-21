<?php

namespace App\Services\Chat;

class SessionEventCollector
{
    /**
     * @var list<array{type: string, id: string, timestamp: int, payload: array<string, mixed>}>
     */
    private array $events = [];

    /**
     * @param  array<string, mixed>  $payload
     */
    public function push(string $eventType, array $payload): int
    {
        $timestamp = (int) round(microtime(true) * 1000);

        $this->events[] = [
            'type' => $eventType,
            'id' => uniqid('evt-', true),
            'timestamp' => $timestamp,
            'payload' => $payload,
        ];

        return $timestamp;
    }

    /**
     * @return list<array{type: string, id: string, timestamp: int, payload: array<string, mixed>}>
     */
    public function all(): array
    {
        return $this->events;
    }
}
