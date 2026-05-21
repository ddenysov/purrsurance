<?php

namespace App\Http\Controllers;

use App\Services\Sse\SessionEventStore;
use App\Support\Sse\SseFormatter;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SseStreamController extends Controller
{
    public function __construct(
        private readonly SessionEventStore $eventStore,
    ) {}

    public function __invoke(Request $request): StreamedResponse
    {
        $sessionId = (string) $request->query('sessionId', 'anonymous');
        $maxDurationSeconds = (int) config('purrsurance.sse_max_duration', 300);
        $pollIntervalSeconds = (int) config('purrsurance.sse_poll_interval', 1);

        return response()->stream(
            function () use ($sessionId, $maxDurationSeconds, $pollIntervalSeconds): void {
                if (ob_get_level()) {
                    ob_end_clean();
                }

                $requestId = uniqid('sse-', true);
                $startedAt = time();
                $eventCount = 0;
                $lastTimestamp = (int) round(microtime(true) * 1000) - 60_000;

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

                    $newEvents = $this->eventStore->getSince($sessionId, $lastTimestamp);

                    foreach ($newEvents as $item) {
                        if (connection_aborted()) {
                            break 2;
                        }

                        $eventCount++;
                        if ($item['timestamp'] > $lastTimestamp) {
                            $lastTimestamp = $item['timestamp'];
                        }

                        echo SseFormatter::format([
                            'type' => $item['eventType'],
                            'id' => $item['requestId'],
                            'timestamp' => $item['timestamp'],
                            'payload' => $item['payload'],
                        ], id: $eventCount);
                        $this->flush();
                    }

                    sleep(max(1, $pollIntervalSeconds));
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
