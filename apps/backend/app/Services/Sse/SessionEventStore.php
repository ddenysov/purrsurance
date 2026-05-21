<?php

namespace App\Services\Sse;

use Illuminate\Support\Facades\Cache;

class SessionEventStore
{
    /**
     * @return array<int, array{timestamp: int, eventType: string, payload: array<string, mixed>, requestId: string}>
     */
    public function getSince(string $sessionId, int $sinceTimestamp): array
    {
        $events = $this->all($sessionId);

        return array_values(array_filter(
            $events,
            static fn (array $event): bool => $event['timestamp'] > $sinceTimestamp,
        ));
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function push(string $sessionId, string $eventType, array $payload): int
    {
        $timestamp = (int) round(microtime(true) * 1000);

        $events = $this->all($sessionId);
        $events[] = [
            'timestamp' => $timestamp,
            'eventType' => $eventType,
            'payload' => $payload,
            'requestId' => uniqid('evt-', true),
        ];

        Cache::put(
            $this->cacheKey($sessionId),
            $events,
            now()->addHours((int) config('purrsurance.sse_events_ttl_hours', 24)),
        );

        return $timestamp;
    }

    /**
     * @return array<int, array{timestamp: int, eventType: string, payload: array<string, mixed>, requestId: string}>
     */
    private function all(string $sessionId): array
    {
        /** @var array<int, array{timestamp: int, eventType: string, payload: array<string, mixed>, requestId: string}>|null $events */
        $events = Cache::get($this->cacheKey($sessionId));

        return is_array($events) ? $events : [];
    }

    private function cacheKey(string $sessionId): string
    {
        return 'sse:events:'.md5($sessionId);
    }
}
