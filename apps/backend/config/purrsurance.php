<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Browser client configuration (Inertia shared props)
    |--------------------------------------------------------------------------
    |
    | Values are exposed to the Vue app as page.props.client. You may set
    | PURRSURANCE_* or legacy NUXT_PUBLIC_* environment variables.
    |
    */

    'api_base_url' => env('PURRSURANCE_API_BASE_URL', env('NUXT_PUBLIC_API_BASE_URL', '/api')),

    'api_timeout' => env('PURRSURANCE_API_TIMEOUT', env('NUXT_PUBLIC_API_TIMEOUT', '10000')),

    'sse_stream_url' => env('PURRSURANCE_SSE_STREAM_URL', env('NUXT_PUBLIC_SSE_STREAM_URL', '/stream')),

    'sse_max_duration' => (int) env('PURRSURANCE_SSE_MAX_DURATION', 300),

    'sse_mock_interval' => (int) env('PURRSURANCE_SSE_MOCK_INTERVAL', 5),

    'chat_api_url' => env('PURRSURANCE_CHAT_API_URL', env('NUXT_PUBLIC_CHAT_API_URL', '/chat')),

    'chat_api_mock' => filter_var(
        env('PURRSURANCE_CHAT_API_MOCK', env('NUXT_PUBLIC_CHAT_API_MOCK', 'false')),
        FILTER_VALIDATE_BOOLEAN
    ),

    'backend_api_url' => env(
        'PURRSURANCE_BACKEND_API_URL',
        env('NUXT_PUBLIC_BACKEND_API_URL', '/api/vet-appointments')
    ),

    'policies_api_url' => env(
        'PURRSURANCE_POLICIES_API_URL',
        env('NUXT_PUBLIC_POLICIES_API_URL', '/api/policies')
    ),
];
