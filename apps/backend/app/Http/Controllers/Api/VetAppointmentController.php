<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VetAppointment;
use Illuminate\Http\JsonResponse;

class VetAppointmentController extends Controller
{
    public function index(): JsonResponse
    {
        $all = VetAppointment::query()
            ->orderByDesc('appointment_date')
            ->get()
            ->map(fn (VetAppointment $appointment) => $appointment->toDynamoDocument())
            ->values();

        $totalCount = $all->count();
        $appointments = $all->take(30)->values();

        return response()->json([
            'success' => true,
            'totalCount' => $totalCount,
            'count' => $appointments->count(),
            'data' => $appointments,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
