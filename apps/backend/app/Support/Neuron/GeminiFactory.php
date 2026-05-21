<?php

namespace App\Support\Neuron;

use NeuronAI\HttpClient\GuzzleHttpClient;
use NeuronAI\HttpClient\HttpClientInterface;
use NeuronAI\Providers\AIProviderInterface;
use NeuronAI\Providers\Gemini\Gemini;
use NeuronAI\RAG\Embeddings\GeminiEmbeddingsProvider;

final class GeminiFactory
{
    public static function httpClient(): HttpClientInterface
    {
        $client = new GuzzleHttpClient(
            timeout: (float) config('gemini.http.timeout', 60),
            connectTimeout: (float) config('gemini.http.connect_timeout', 10),
        );

        if (! config('gemini.retry.enabled', true)) {
            return $client;
        }

        return new RetryingHttpClient(
            inner: $client,
            maxAttempts: (int) config('gemini.retry.max_attempts', 4),
            baseDelayMs: (int) config('gemini.retry.base_delay_ms', 500),
            maxDelayMs: (int) config('gemini.retry.max_delay_ms', 30000),
        );
    }

    public static function provider(): AIProviderInterface
    {
        $httpClient = self::httpClient();
        $key = (string) config('gemini.api_key');
        $model = (string) config('gemini.model');

        if (! config('gemini.retry.enabled', true)) {
            return new Gemini($key, $model, httpClient: $httpClient);
        }

        return new ResilientGemini(
            key: $key,
            model: $model,
            httpClient: $httpClient,
            maxAttempts: (int) config('gemini.retry.max_attempts', 4),
            baseDelayMs: (int) config('gemini.retry.base_delay_ms', 500),
            maxDelayMs: (int) config('gemini.retry.max_delay_ms', 30000),
        );
    }

    public static function embeddingsProvider(?string $model = null): GeminiEmbeddingsProvider
    {
        return new GeminiEmbeddingsProvider(
            key: (string) config('gemini.api_key'),
            model: $model ?? (string) config('rag.embeddings.model', 'gemini-embedding-001'),
            httpClient: self::httpClient(),
        );
    }
}
