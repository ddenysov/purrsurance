<?php

namespace App\Http\Controllers;

use App\Support\Sse\SseFormatter;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SseStreamController extends Controller
{
    private const MOCK_EVENT_TYPES = ['claim_status', 'policy_updated', 'message', 'notification'];

    public function __invoke(Request $request): StreamedResponse
    {
        $sessionId = $request->query('sessionId', 'anonymous');
        $maxDurationSeconds = (int) config('purrsurance.sse_max_duration', 300);
        $mockIntervalSeconds = (int) config('purrsurance.sse_mock_interval', 5);

        return response()->stream(
            function () use ($sessionId, $maxDurationSeconds, $mockIntervalSeconds): void {
                if (ob_get_level()) {
                    ob_end_clean();
                }

                $requestId = uniqid('sse-', true);
                $startedAt = time();
                $eventCount = 0;

                echo SseFormatter::format([
                    'connectionId' => $requestId,
                    'message' => 'Connection established',
                    'timestamp' => now()->toIso8601String(),
                    'sessionId' => $sessionId,
                ], event: 'connected', id: 0);
                $this->flush();

                while (time() - $startedAt < $maxDurationSeconds) {
                    if (connection_aborted()) {
                        break;
                    }

                    $eventCount++;
                    $eventType = self::MOCK_EVENT_TYPES[($eventCount - 1) % count(self::MOCK_EVENT_TYPES)];

                    echo SseFormatter::format([
                        'type' => $eventType,
                        'id' => "mock-{$eventCount}",
                        'timestamp' => (int) round(microtime(true) * 1000),
                        'payload' => [
                            'eventType' => $eventType,
                            'timestamp' => (int) round(microtime(true) * 1000),
                            'data' => [
                                'message' => "Mock event {$eventCount} - {$eventType}",
                                'count' => $eventCount,
                                'sessionId' => $sessionId,
                            ],
                        ],
                    ], id: $eventCount);
                    $this->flush();

                    sleep($mockIntervalSeconds);
                }

                echo SseFormatter::format([
                    'message' => 'Stream closing',
                    'timestamp' => now()->toIso8601String(),
                ], event: 'goodbye');
                $this->flush();
            },
            200,
            [
                'Content-Type' => 'text/event-stream',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Connection' => 'keep-alive',
                'X-Accel-Buffering' => 'no',
            ],
        );
    }

    private function flush(): void
    {
        if (ob_get_level()) {
            ob_flush();
        }

        flush();
    }
}
