<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VetAppointment extends Model
{
    protected $table = 'vet_appointments';

    protected $primaryKey = 'appointment_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'appointment_id',
        'policy_id',
        'pet_id',
        'appointment_date',
        'status',
        'pet',
        'owner',
        'clinic',
        'appointment_details',
        'medical_context',
        'session_id',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'datetime',
            'pet' => 'array',
            'owner' => 'array',
            'clinic' => 'array',
            'appointment_details' => 'array',
            'medical_context' => 'array',
        ];
    }

    /**
     * Shape compatible with VetAppointments DynamoDB documents and the appointments UI.
     *
     * @return array<string, mixed>
     */
    public function toDynamoDocument(): array
    {
        $document = [
            'appointmentId' => $this->appointment_id,
            'policyId' => $this->policy_id,
            'petId' => $this->pet_id,
            'appointmentDate' => $this->appointment_date?->toIso8601String(),
            'status' => $this->status,
            'pet' => $this->pet,
            'owner' => $this->owner,
            'clinic' => $this->clinic,
            'appointment' => $this->appointment_details,
            'sessionId' => $this->session_id,
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];

        if ($this->medical_context !== null) {
            $document['medicalContext'] = $this->medical_context;
        }

        return $document;
    }
}
