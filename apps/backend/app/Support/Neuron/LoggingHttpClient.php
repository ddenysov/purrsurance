<?php

namespace App\Support\Neuron;

use Illuminate\Support\Facades\Log;
use NeuronAI\HttpClient\HttpClientInterface;
use NeuronAI\HttpClient\HttpRequest;
use NeuronAI\HttpClient\HttpResponse;
use NeuronAI\HttpClient\StreamInterface;

final class LoggingHttpClient implements HttpClientInterface
{
    private const MAX_BODY_LOG_CHARS = 50_000;

    public function __construct(
        private readonly HttpClientInterface $inner,
        private readonly bool $enabled = true,
    ) {}

    public function request(HttpRequest $request): HttpResponse
    {
        if (! $this->enabled) {
            return $this->inner->request($request);
        }

        $this->logRequest($request);

        $response = $this->inner->request($request);

        $this->logResponse($request, $response);

        return $response;
    }

    public function stream(HttpRequest $request): StreamInterface
    {
        if ($this->enabled) {
            $this->logRequest($request);
            Log::info('Gemini LLM stream started', [
                'method' => $request->method->value,
                'uri' => $request->uri,
            ]);
        }

        return $this->inner->stream($request);
    }

    public function withBaseUri(string $baseUri): HttpClientInterface
    {
        return new self(
            inner: $this->inner->withBaseUri($baseUri),
            enabled: $this->enabled,
        );
    }

    public function withHeaders(array $headers): HttpClientInterface
    {
        return new self(
            inner: $this->inner->withHeaders($headers),
            enabled: $this->enabled,
        );
    }

    public function withTimeout(float $timeout): HttpClientInterface
    {
        return new self(
            inner: $this->inner->withTimeout($timeout),
            enabled: $this->enabled,
        );
    }

    private function logRequest(HttpRequest $request): void
    {
        Log::info('Gemini LLM request', [
            'method' => $request->method->value,
            'uri' => $request->uri,
            'headers' => $this->redactHeaders($request->headers),
            'body' => $this->formatBodyForLog($request->body),
        ]);
    }

    private function logResponse(HttpRequest $request, HttpResponse $response): void
    {
        Log::info('Gemini LLM response', [
            'method' => $request->method->value,
            'uri' => $request->uri,
            'status' => $response->statusCode,
            'successful' => $response->isSuccessful(),
            'body' => $this->formatBodyForLog($response->body),
        ]);
    }

    /**
     * @param  array<string, string>  $headers
     * @return array<string, string>
     */
    private function redactHeaders(array $headers): array
    {
        $redacted = [];

        foreach ($headers as $name => $value) {
            $redacted[$name] = strtolower($name) === 'x-goog-api-key' ? '[REDACTED]' : $value;
        }

        return $redacted;
    }

    private function formatBodyForLog(array|string|null $body): mixed
    {
        if ($body === null) {
            return null;
        }

        if (is_array($body)) {
            return $this->truncateValue($this->redactEmbeddingsInArray($body));
        }

        $decoded = json_decode($body, true);

        if (is_array($decoded)) {
            return $this->truncateValue($this->redactEmbeddingsInArray($decoded));
        }

        return $this->truncateString($body);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function redactEmbeddingsInArray(array $data): array
    {
        foreach ($data as $key => $value) {
            if ($key === 'values' && is_array($value) && $this->looksLikeEmbeddingVector($value)) {
                $data[$key] = [
                    'preview' => array_slice($value, 0, 5),
                    'dimensions' => count($value),
                ];

                continue;
            }

            if (is_array($value)) {
                $data[$key] = $this->redactEmbeddingsInArray($value);
            }
        }

        return $data;
    }

    /**
     * @param  array<int, mixed>  $values
     */
    private function looksLikeEmbeddingVector(array $values): bool
    {
        if (count($values) < 64) {
            return false;
        }

        return isset($values[0]) && is_float($values[0]);
    }

    private function truncateValue(mixed $value): mixed
    {
        $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);

        if (! is_string($encoded) || strlen($encoded) <= self::MAX_BODY_LOG_CHARS) {
            return $value;
        }

        return [
            '_truncated' => true,
            '_preview' => substr($encoded, 0, self::MAX_BODY_LOG_CHARS).'...',
            '_originalLength' => strlen($encoded),
        ];
    }

    private function truncateString(string $body): string
    {
        if (strlen($body) <= self::MAX_BODY_LOG_CHARS) {
            return $body;
        }

        return sprintf(
            '%s... (body truncated, %d chars total)',
            substr($body, 0, self::MAX_BODY_LOG_CHARS),
            strlen($body),
        );
    }
}
