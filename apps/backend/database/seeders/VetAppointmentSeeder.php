<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\MapsDynamoSeedRecords;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VetAppointmentSeeder extends Seeder
{
    use MapsDynamoSeedRecords;

    public function run(): void
    {
        $appointments = $this->loadSeedJson('appointments.json');

        foreach ($appointments as $appointment) {
            DB::table('vet_appointments')->updateOrInsert(
                ['appointment_id' => $appointment['appointmentId']],
                $this->mapVetAppointmentRecord($appointment),
            );
        }

        $this->command?->info('Seeded '.count($appointments).' vet appointments.');
    }
}
