<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Policy;
use Illuminate\Http\JsonResponse;

class PolicyController extends Controller
{
    public function index(): JsonResponse
    {
        $policies = Policy::query()
            ->orderBy('policy_id')
            ->get()
            ->map(fn (Policy $policy) => $policy->toDynamoDocument())
            ->values();

        $totalCount = $policies->count();

        return response()->json([
            'success' => true,
            'totalCount' => $totalCount,
            'count' => $totalCount,
            'data' => $policies,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
