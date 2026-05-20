<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\MapsDynamoSeedRecords;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PolicySeeder extends Seeder
{
    use MapsDynamoSeedRecords;

    public function run(): void
    {
        $policies = $this->loadSeedJson('policies.json');

        foreach ($policies as $policy) {
            DB::table('policies')->updateOrInsert(
                ['policy_id' => $policy['policyId']],
                $this->mapPolicyRecord($policy),
            );
        }

        $this->command?->info('Seeded '.count($policies).' policies.');
    }
}
