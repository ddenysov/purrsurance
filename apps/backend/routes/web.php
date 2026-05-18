<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Home'))->name('home');

Route::get('/appointments', fn () => Inertia::render('Appointments'))->name('appointments');

Route::get('/admin', fn () => Inertia::render('Admin'))->name('admin');
