<?php

namespace App\Support\Neuron;

use Generator;
use Illuminate\Support\Facades\Log;
use NeuronAI\Chat\Messages\Message;
use NeuronAI\Exceptions\HttpException;
use NeuronAI\HttpClient\HttpClientInterface;
use NeuronAI\Providers\Gemini\Gemini;
use Throwable;

class ResilientGemini extends Gemini
{
    public function __construct(
        string $key,
        string $model,
        array $parameters = [],
        ?HttpClientInterface $httpClient = null,
        private readonly int $maxAttempts = 4,
        private readonly int $baseDelayMs = 500,
        private readonly int $maxDelayMs = 30000,
    ) {
        parent::__construct($key, $model, $parameters, $httpClient);
    }

    public function chat(Message ...$messages): Message
    {
        return $this->withRetry(fn (): Message => parent::chat(...$messages), 'chat');
    }

    public function stream(Message ...$messages): Generator
    {
        return $this->withRetry(fn (): Generator => parent::stream(...$messages), 'stream');
    }

    public function structured(array|Message $messages, string $class, array $response_schema): Message
    {
        return $this->withRetry(
            fn (): Message => parent::structured($messages, $class, $response_schema),
            'structured',
        );
    }

    /**
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    private function withRetry(callable $callback, string $operation): mixed
    {
        $attempt = 0;
        $lastException = null;

        while ($attempt < $this->maxAttempts) {
            $attempt++;

            try {
                return $callback();
            } catch (Throwable $exception) {
                $lastException = $exception;

                // HTTP-layer RetryingHttpClient already retried transport failures.
                if ($exception instanceof HttpException) {
                    throw $exception;
                }

                if (! TransientLlmError::isRetryable($exception) || $attempt >= $this->maxAttempts) {
                    throw $exception;
                }

                Log::warning('Gemini provider retry', [
                    'operation' => $operation,
                    'reason' => $exception->getMessage(),
                    'attempt' => $attempt,
                    'max_attempts' => $this->maxAttempts,
                    'exception' => $exception::class,
                ]);

                $this->sleep($attempt);
            }
        }

        if ($lastException instanceof Throwable) {
            throw $lastException;
        }

        return $callback();
    }

    private function sleep(int $attempt): void
    {
        $delayMs = min(
            $this->maxDelayMs,
            (int) ($this->baseDelayMs * (2 ** ($attempt - 1))),
        );

        $jitterMs = $delayMs > 0 ? random_int(0, (int) ($delayMs * 0.25)) : 0;

        usleep(($delayMs + $jitterMs) * 1000);
    }
}
