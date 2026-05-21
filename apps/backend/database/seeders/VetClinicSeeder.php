<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\MapsDynamoSeedRecords;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VetClinicSeeder extends Seeder
{
    use MapsDynamoSeedRecords;

    public function run(): void
    {
        $clinics = $this->loadSeedJson('clinics.json');

        foreach ($clinics as $clinic) {
            DB::table('vet_clinics')->updateOrInsert(
                ['clinic_id' => $clinic['id']],
                $this->mapVetClinicRecord($clinic),
            );
        }

        $this->command?->info('Seeded '.count($clinics).' vet clinics.');
    }
}
