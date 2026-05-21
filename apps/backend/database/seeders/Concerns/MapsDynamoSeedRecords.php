<?php

namespace Database\Seeders\Concerns;

use Carbon\Carbon;

trait MapsDynamoSeedRecords
{
    protected function seedDataPath(string $filename): string
    {
        return database_path('seeders/data/'.$filename);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function loadSeedJson(string $filename): array
    {
        $path = $this->seedDataPath($filename);
        $json = file_get_contents($path);
        $data = json_decode($json, true, 512, JSON_THROW_ON_ERROR);

        if (! is_array($data)) {
            throw new \RuntimeException("Invalid seed data in {$path}");
        }

        return $data;
    }

    /**
     * @param  array<string, mixed>  $policy
     * @return array<string, mixed>
     */
    protected function mapPolicyRecord(array $policy): array
    {
        return [
            'policy_id' => $policy['policyId'],
            'owner_id' => $policy['ownerId'],
            'status' => $policy['status'],
            'pet' => json_encode($policy['pet'], JSON_THROW_ON_ERROR),
            'owner' => json_encode($policy['owner'], JSON_THROW_ON_ERROR),
            'policy_details' => json_encode($policy['policy'], JSON_THROW_ON_ERROR),
            'medical' => json_encode($policy['medical'], JSON_THROW_ON_ERROR),
            'created_at' => Carbon::parse($policy['createdAt']),
            'updated_at' => Carbon::parse($policy['updatedAt']),
        ];
    }

    /**
     * @param  array<string, mixed>  $appointment
     * @return array<string, mixed>
     */
    protected function mapVetAppointmentRecord(array $appointment): array
    {
        $row = [
            'appointment_id' => $appointment['appointmentId'],
            'policy_id' => $appointment['policyId'],
            'pet_id' => $appointment['petId'],
            'appointment_date' => Carbon::parse($appointment['appointmentDate']),
            'status' => $appointment['status'],
            'pet' => json_encode($appointment['pet'], JSON_THROW_ON_ERROR),
            'owner' => json_encode($appointment['owner'], JSON_THROW_ON_ERROR),
            'clinic' => json_encode($appointment['clinic'], JSON_THROW_ON_ERROR),
            'appointment_details' => json_encode($appointment['appointment'], JSON_THROW_ON_ERROR),
            'session_id' => $appointment['sessionId'] ?? null,
            'created_at' => Carbon::parse($appointment['createdAt']),
            'updated_at' => Carbon::parse($appointment['updatedAt']),
        ];

        $row['medical_context'] = isset($appointment['medicalContext'])
            ? json_encode($appointment['medicalContext'], JSON_THROW_ON_ERROR)
            : null;

        return $row;
    }

    /**
     * @param  array<string, mixed>  $clinic
     * @return array<string, mixed>
     */
    protected function mapVetClinicRecord(array $clinic): array
    {
        $now = now();

        return [
            'name' => $clinic['name'],
            'address' => json_encode($clinic['address'], JSON_THROW_ON_ERROR),
            'phone' => $clinic['phone'],
            'email' => $clinic['email'],
            'specialty' => $clinic['specialty'],
            'accepts_insurance' => (bool) ($clinic['acceptsInsurance'] ?? true),
            'city' => $clinic['address']['city'],
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }
}
