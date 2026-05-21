<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChatRequest;
use App\Services\AgentRouter\AgentRouter;
use Illuminate\Http\JsonResponse;
use Throwable;

class ChatController extends Controller
{
    public function __construct(
        private readonly AgentRouter $agentRouter,
    ) {}

    public function __invoke(ChatRequest $request): JsonResponse
    {
        if (blank(config('gemini.api_key'))) {
            return response()->json([
                'error' => 'Internal Server Error',
                'message' => 'GEMINI_API_KEY is not configured',
            ], 500);
        }

        $requestId = $request->header('X-Request-Id') ?? uniqid('req-', true);

        try {
            $result = $this->agentRouter->route(
                message: $request->validated('message'),
                chatHistory: $request->validated('chatHistory') ?? [],
                sessionId: $request->validated('sessionId'),
                policyId: $request->validated('policyId'),
                globalSessionId: $request->validated('globalSessionId'),
            );

            $data = [
                'response' => $result->response,
                'sessionId' => $result->sessionId,
            ];

            if ($result->structured !== null) {
                $data['structured'] = $result->structured;
            }

            return response()->json([
                'message' => 'Success',
                'data' => $data,
                'metadata' => [
                    'requestId' => $requestId,
                    'classification' => $result->classification,
                    'message' => $request->validated('message'),
                    'agentId' => $result->agentId,
                    'timestamp' => now()->toIso8601String(),
                    'environment' => config('app.env'),
                    'events' => $result->events,
                ],
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'error' => 'Internal Server Error',
                'message' => $exception->getMessage(),
                'requestId' => $requestId,
            ], 500);
        }
    }
}
