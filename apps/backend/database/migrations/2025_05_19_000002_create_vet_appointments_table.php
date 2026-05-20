<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Mirrors data/seeds/002_appointments_seed.mjs and data/APPOINTMENTS-SCHEMA.md (VetAppointments table).
     *
     * Nested snapshots are stored as JSON: pet, owner, clinic, appointment, medical_context.
     */
    public function up(): void
    {
        Schema::create('vet_appointments', function (Blueprint $table) {
            $table->string('appointment_id')->primary();

            $table->string('policy_id');
            $table->string('pet_id');
            $table->dateTime('appointment_date');
            $table->string('status', 32);

            $table->json('pet');
            $table->json('owner');
            $table->json('clinic');
            $table->json('appointment_details');
            $table->json('medical_context')->nullable();

            $table->string('session_id')->nullable();

            $table->timestamps();

            $table->foreign('policy_id')
                ->references('policy_id')
                ->on('policies')
                ->cascadeOnDelete();

            $table->index(['policy_id', 'appointment_date']);
            $table->index(['pet_id', 'appointment_date']);
            $table->index(['status', 'appointment_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vet_appointments');
    }
};
