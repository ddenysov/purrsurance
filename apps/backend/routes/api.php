<?php

use App\Http\Controllers\Api\PolicyController;
use Illuminate\Support\Facades\Route;

Route::get('/policies', [PolicyController::class, 'index']);
