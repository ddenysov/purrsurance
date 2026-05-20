<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Mirrors data/seeds/001_policies_seed.mjs and data/SCHEMA.md (Policies table).
     *
     * Nested objects are stored as JSON to match the DynamoDB document shape:
     * pet, owner, policy (coverage details), medical.
     */
    public function up(): void
    {
        Schema::create('policies', function (Blueprint $table) {
            $table->string('policy_id')->primary();

            $table->string('owner_id')->index();
            $table->string('status', 32)->index();

            $table->json('pet');
            $table->json('owner');
            $table->json('policy_details');
            $table->json('medical');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policies');
    }
};
