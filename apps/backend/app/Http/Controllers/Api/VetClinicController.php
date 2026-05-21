<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VetClinic;
use Illuminate\Http\JsonResponse;

class VetClinicController extends Controller
{
    public function index(): JsonResponse
    {
        $clinics = VetClinic::query()
            ->orderBy('city')
            ->orderBy('name')
            ->get()
            ->map(fn (VetClinic $clinic) => $clinic->toBookingDocument())
            ->values();

        $totalCount = $clinics->count();

        return response()->json([
            'success' => true,
            'totalCount' => $totalCount,
            'count' => $totalCount,
            'data' => $clinics,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
