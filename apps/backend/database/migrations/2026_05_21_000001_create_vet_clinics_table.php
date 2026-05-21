<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Partner vet clinics for appointment booking (mirrors tool-find-vet-clinic mock data).
     */
    public function up(): void
    {
        Schema::create('vet_clinics', function (Blueprint $table) {
            $table->string('clinic_id')->primary();

            $table->string('name');
            $table->json('address');
            $table->string('phone');
            $table->string('email');
            $table->string('specialty');
            $table->boolean('accepts_insurance')->default(true);

            $table->string('city')->index();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vet_clinics');
    }
};
