<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'client' => [
                'apiBaseUrl' => config('purrsurance.api_base_url'),
                'apiTimeout' => config('purrsurance.api_timeout'),
                'sseStreamUrl' => config('purrsurance.sse_stream_url'),
                'chatApiUrl' => config('purrsurance.chat_api_url'),
                'chatApiMock' => config('purrsurance.chat_api_mock'),
                'backendApiUrl' => config('purrsurance.backend_api_url'),
                'policiesApiUrl' => config('purrsurance.policies_api_url'),
            ],
        ];
    }
}
