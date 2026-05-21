<?php

use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\PolicyController;
use App\Http\Controllers\Api\VetAppointmentController;
use App\Http\Controllers\Api\VetClinicController;
use Illuminate\Support\Facades\Route;

Route::options('/chat', fn () => response('', 200)
    ->header('Access-Control-Allow-Origin', '*')
    ->header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    ->header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
);

Route::post('/chat', ChatController::class)->name('api.chat');

Route::get('/policies', [PolicyController::class, 'index']);

Route::get('/vet-appointments', [VetAppointmentController::class, 'index']);

Route::get('/clinics', [VetClinicController::class, 'index']);
