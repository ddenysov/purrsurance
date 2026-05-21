<?php

namespace App\Support\Neuron;

use NeuronAI\Exceptions\HttpException;
use NeuronAI\Exceptions\ProviderException;
use NeuronAI\HttpClient\HttpResponse;
use Throwable;

final class TransientLlmError
{
    /**
     * @var list<int>
     */
    private const RETRYABLE_HTTP_STATUS_CODES = [429, 502, 503, 504];

    /**
     * @var list<string>
     */
    private const RETRYABLE_MESSAGE_PATTERNS = [
        '429',
        '502',
        '503',
        '504',
        'RESOURCE_EXHAUSTED',
        'UNAVAILABLE',
        'BAD_GATEWAY',
        'GATEWAY_TIMEOUT',
        'SERVICE_UNAVAILABLE',
        'Network error',
        'Error 502 (Server Error)',
        'Error 503',
        'Error 504',
        'temporary error and could not complete your request',
        'MALFORMED_FUNCTION_CALL',
    ];

    public static function isRetryable(Throwable $exception): bool
    {
        if ($exception instanceof HttpException) {
            if (self::isPermanentClientError($exception->getMessage())) {
                return false;
            }

            if ($exception->response !== null && self::isRetryableHttpStatus($exception->response->statusCode)) {
                return true;
            }

            return self::messageMatches($exception->getMessage());
        }

        if ($exception instanceof ProviderException) {
            return self::messageMatches($exception->getMessage());
        }

        return self::messageMatches($exception->getMessage());
    }

    public static function isRetryableHttpResponse(HttpResponse $response): bool
    {
        return self::isRetryableHttpStatus($response->statusCode);
    }

    private static function isRetryableHttpStatus(int $statusCode): bool
    {
        return in_array($statusCode, self::RETRYABLE_HTTP_STATUS_CODES, true);
    }

    private static function messageMatches(string $message): bool
    {
        if (self::isPermanentClientError($message)) {
            return false;
        }

        foreach (self::RETRYABLE_MESSAGE_PATTERNS as $pattern) {
            if (str_contains($message, $pattern)) {
                return true;
            }
        }

        return false;
    }

    private static function isPermanentClientError(string $message): bool
    {
        return str_contains($message, 'INVALID_ARGUMENT')
            || str_contains($message, 'Invalid JSON payload');
    }
}
