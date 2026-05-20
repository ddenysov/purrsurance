<?php

use App\Http\Controllers\SseStreamController;
use Illuminate\Support\Facades\Route;

Route::get('/stream', SseStreamController::class)->name('sse.stream');
