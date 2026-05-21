<?php

namespace App\Support\Neuron;

use Illuminate\Support\Facades\Log;
use NeuronAI\Exceptions\HttpException;
use NeuronAI\HttpClient\HttpClientInterface;
use NeuronAI\HttpClient\HttpRequest;
use NeuronAI\HttpClient\HttpResponse;
use NeuronAI\HttpClient\StreamInterface;

final class RetryingHttpClient implements HttpClientInterface
{
    public function __construct(
        private readonly HttpClientInterface $inner,
        private readonly int $maxAttempts = 4,
        private readonly int $baseDelayMs = 500,
        private readonly int $maxDelayMs = 30000,
    ) {}

    public function request(HttpRequest $request): HttpResponse
    {
        $attempt = 0;
        $lastException = null;

        while ($attempt < $this->maxAttempts) {
            $attempt++;

            try {
                $response = $this->inner->request($request);

                if (TransientLlmError::isRetryableHttpResponse($response) && $attempt < $this->maxAttempts) {
                    $this->logRetry('HTTP '.$response->statusCode, $attempt, $request);
                    $this->sleep($attempt);

                    continue;
                }

                return $response;
            } catch (HttpException $exception) {
                $lastException = $exception;

                if (! TransientLlmError::isRetryable($exception) || $attempt >= $this->maxAttempts) {
                    throw $exception;
                }

                $this->logRetry($exception->getMessage(), $attempt, $request);
                $this->sleep($attempt);
            }
        }

        if ($lastException instanceof HttpException) {
            throw $lastException;
        }

        return $this->inner->request($request);
    }

    public function stream(HttpRequest $request): StreamInterface
    {
        $attempt = 0;
        $lastException = null;

        while ($attempt < $this->maxAttempts) {
            $attempt++;

            try {
                return $this->inner->stream($request);
            } catch (HttpException $exception) {
                $lastException = $exception;

                if (! TransientLlmError::isRetryable($exception) || $attempt >= $this->maxAttempts) {
                    throw $exception;
                }

                $this->logRetry($exception->getMessage(), $attempt, $request);
                $this->sleep($attempt);
            }
        }

        if ($lastException instanceof HttpException) {
            throw $lastException;
        }

        return $this->inner->stream($request);
    }

    public function withBaseUri(string $baseUri): HttpClientInterface
    {
        return new self(
            inner: $this->inner->withBaseUri($baseUri),
            maxAttempts: $this->maxAttempts,
            baseDelayMs: $this->baseDelayMs,
            maxDelayMs: $this->maxDelayMs,
        );
    }

    public function withHeaders(array $headers): HttpClientInterface
    {
        return new self(
            inner: $this->inner->withHeaders($headers),
            maxAttempts: $this->maxAttempts,
            baseDelayMs: $this->baseDelayMs,
            maxDelayMs: $this->maxDelayMs,
        );
    }

    public function withTimeout(float $timeout): HttpClientInterface
    {
        return new self(
            inner: $this->inner->withTimeout($timeout),
            maxAttempts: $this->maxAttempts,
            baseDelayMs: $this->baseDelayMs,
            maxDelayMs: $this->maxDelayMs,
        );
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

    private function logRetry(string $reason, int $attempt, HttpRequest $request): void
    {
        Log::warning('Gemini HTTP request retry', [
            'reason' => $reason,
            'attempt' => $attempt,
            'max_attempts' => $this->maxAttempts,
            'method' => $request->method->value,
            'uri' => $request->uri,
        ]);
    }
}
