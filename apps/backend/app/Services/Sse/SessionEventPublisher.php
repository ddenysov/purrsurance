<?php

namespace App\Services\Sse;

use Illuminate\Support\Facades\Log;

class SessionEventPublisher
{
    /** Matches AWS tool + frontend listener (typo preserved). */
    public const EVENT_RECOMMEND_DOCTOR_VISIT = 'ReccomendDoctorVisit';

    public function __construct(
        private readonly SessionEventStore $store,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function publish(string $sessionId, string $eventType, array $data): void
    {
        if ($sessionId === '') {
            Log::warning('SSE event skipped: empty sessionId', ['eventType' => $eventType]);

            return;
        }

        $timestamp = $this->store->push($sessionId, $eventType, [
            'eventType' => $eventType,
            'timestamp' => (int) round(microtime(true) * 1000),
            'data' => $data,
        ]);

        Log::info('SSE event published', [
            'sessionId' => $sessionId,
            'eventType' => $eventType,
            'timestamp' => $timestamp,
        ]);
    }

    /**
     * @param  array<string, mixed>  $toolPayload  Decoded JSON from RecommendDoctorVisit tool.
     */
    public function publishRecommendDoctorVisit(string $sessionId, array $toolPayload): void
    {
        $message = null;
        if (isset($toolPayload['recommendation']) && is_array($toolPayload['recommendation'])) {
            $message = $toolPayload['recommendation']['message'] ?? null;
        }

        $data = $toolPayload;
        if (is_string($message) && $message !== '') {
            $data['message'] = $message;
        }

        $this->publish($sessionId, self::EVENT_RECOMMEND_DOCTOR_VISIT, $data);
    }
}
