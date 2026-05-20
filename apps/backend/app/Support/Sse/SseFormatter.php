<?php

namespace App\Support\Sse;

class SseFormatter
{
    /**
     * @param  array<string, mixed>|string  $data
     */
    public static function format(
        array|string $data,
        ?string $event = null,
        int|string|null $id = null,
        ?int $retry = null,
    ): string {
        $message = '';

        if ($event !== null) {
            $message .= "event: {$event}\n";
        }

        if ($id !== null) {
            $message .= "id: {$id}\n";
        }

        if ($retry !== null) {
            $message .= "retry: {$retry}\n";
        }

        $dataString = is_string($data) ? $data : json_encode($data, JSON_UNESCAPED_UNICODE);
        foreach (explode("\n", $dataString) as $line) {
            $message .= "data: {$line}\n";
        }

        return $message."\n";
    }
}
