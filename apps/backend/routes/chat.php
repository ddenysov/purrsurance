<?php

use App\Http\Controllers\Api\ChatController;
use Illuminate\Support\Facades\Route;

Route::options('/chat', fn () => response('', 200)
    ->header('Access-Control-Allow-Origin', '*')
    ->header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    ->header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
);

Route::post('/chat', ChatController::class)->name('chat');
