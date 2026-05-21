<?php

return [

    'api_key' => env('GEMINI_API_KEY'),

    'model' => env('GEMINI_MODEL', 'gemini-2.0-flash'),

    'http' => [
        'timeout' => (float) env('GEMINI_HTTP_TIMEOUT', 60),
        'connect_timeout' => (float) env('GEMINI_HTTP_CONNECT_TIMEOUT', 10),
    ],

    'retry' => [
        'enabled' => (bool) env('GEMINI_RETRY_ENABLED', true),
        'max_attempts' => (int) env('GEMINI_RETRY_MAX_ATTEMPTS', 4),
        'base_delay_ms' => (int) env('GEMINI_RETRY_BASE_DELAY_MS', 500),
        'max_delay_ms' => (int) env('GEMINI_RETRY_MAX_DELAY_MS', 30000),
    ],

];
