<?php

namespace App\Agents\Tools;

use App\Models\Policy;
use App\Models\VetAppointment;
use App\Models\VetClinic;
use App\Services\Chat\ChatSessionContext;
use App\Services\Chat\SessionEventPublisher;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Str;
use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\Tool;
use NeuronAI\Tools\ToolProperty;
use Throwable;

class BookVetClinicTool extends Tool
{
    private const APPOINTMENT_TYPES = [
        'routine',
        'urgent',
        'emergency',
        'specialist',
        'follow-up',
        'vaccination',
        'dental',
        'grooming',
    ];

    public function __construct(
        private readonly SessionEventPublisher $eventPublisher,
        private readonly ChatSessionContext $chatSession,
    ) {
        parent::__construct(
            name: 'BookVetClinic',
            description: 'Books a veterinary appointment at a partner clinic. Creates a record in the system and returns a confirmation number. Pet and owner data are loaded from the session policy; clinic data from the clinic ID (use an id returned by FindVetClinic).',
        );
    }

    /**
     * @return ToolProperty[]
     */
    protected function properties(): array
    {
        return [
            ToolProperty::make(
                name: 'clinicId',
                type: PropertyType::STRING,
                description: 'ID of the selected clinic from FindVetClinic results (e.g. CLINIC-KV-001).',
                required: true,
            ),
            ToolProperty::make(
                name: 'appointmentDate',
                type: PropertyType::STRING,
                description: 'Appointment date and time in ISO 8601 format (e.g. 2025-10-15T14:30:00Z).',
                required: true,
            ),
            ToolProperty::make(
                name: 'appointmentType',
                type: PropertyType::STRING,
                description: 'Type of appointment: routine, urgent, emergency, specialist, follow-up, vaccination, dental, grooming.',
                required: true,
                enum: self::APPOINTMENT_TYPES,
            ),
            ToolProperty::make(
                name: 'reason',
                type: PropertyType::STRING,
                description: 'Reason for the visit (e.g. annual checkup, vaccination, illness symptoms).',
                required: true,
            ),
            ToolProperty::make(
                name: 'notes',
                type: PropertyType::STRING,
                description: 'Optional notes or special requests for the clinic.',
                required: false,
            ),
        ];
    }

    public function __invoke(
        ?string $clinicId,
        ?string $appointmentDate,
        ?string $appointmentType,
        ?string $reason,
        ?string $notes = null,
    ): string {
        $clinicId = trim((string) $clinicId);
        $appointmentDateRaw = trim((string) $appointmentDate);
        $appointmentType = trim((string) $appointmentType);
        $reason = trim((string) $reason);
        $notes = $notes !== null ? trim($notes) : '';

        if ($clinicId === '' || $appointmentDateRaw === '' || $appointmentType === '' || $reason === '') {
            return $this->errorResponse('Missing required booking parameters (clinicId, appointmentDate, appointmentType, reason).');
        }

        if (! in_array($appointmentType, self::APPOINTMENT_TYPES, true)) {
            return $this->errorResponse('Invalid appointmentType. Use one of: '.implode(', ', self::APPOINTMENT_TYPES).'.');
        }

        $policyId = $this->chatSession->policyId;
        if ($policyId === null) {
            return $this->errorResponse('Policy ID not found in session. Ask the user to provide their policy ID (e.g. POL-2025-123456) and ensure it is sent with the chat request.');
        }

        $policy = Policy::query()->find($policyId);
        if ($policy === null) {
            return $this->errorResponse("Policy not found: {$policyId}");
        }

        $clinic = VetClinic::query()->find($clinicId);
        if ($clinic === null) {
            return $this->errorResponse("Clinic not found: {$clinicId}. Use FindVetClinic and pass a valid clinic id from the results.");
        }

        try {
            $appointmentAt = Carbon::parse($appointmentDateRaw);
        } catch (Throwable) {
            return $this->errorResponse('Invalid appointmentDate. Use ISO 8601 format (e.g. 2025-10-15T14:30:00Z).');
        }

        $petInfo = $policy->pet ?? [];
        $ownerInfo = $policy->owner ?? [];
        $petId = is_string($petInfo['id'] ?? null) && $petInfo['id'] !== ''
            ? $petInfo['id']
            : 'PET-'.now()->getTimestamp();

        $appointmentId = $this->generateAppointmentId();
        $confirmationNumber = $this->generateConfirmationNumber($clinicId, $appointmentAt);
        $arrivalTime = $appointmentAt->copy()->subMinutes(10);
        $duration = 30;

        $clinicDocument = $clinic->toBookingDocument();
        $appointmentDetails = [
            'type' => $appointmentType,
            'reason' => $reason,
            'appointmentDate' => $appointmentAt->toIso8601String(),
            'duration' => $duration,
            'notes' => $notes,
            'confirmationNumber' => $confirmationNumber,
            'arrivalTime' => $arrivalTime->toIso8601String(),
        ];

        $petSnapshot = $this->petSnapshot($petInfo, $petId);
        $ownerSnapshot = $this->ownerSnapshot($ownerInfo);

        VetAppointment::query()->create([
            'appointment_id' => $appointmentId,
            'policy_id' => $policyId,
            'pet_id' => $petId,
            'appointment_date' => $appointmentAt,
            'status' => 'scheduled',
            'pet' => $petSnapshot,
            'owner' => $ownerSnapshot,
            'clinic' => $clinicDocument,
            'appointment_details' => $appointmentDetails,
            'session_id' => $this->chatSession->sessionId,
        ]);

        $response = [
            'success' => true,
            'message' => 'Appointment booked successfully',
            'appointment' => [
                'appointmentId' => $appointmentId,
                'confirmationNumber' => $confirmationNumber,
                'pet' => [
                    'name' => $petSnapshot['name'] ?? null,
                    'species' => $petSnapshot['species'] ?? null,
                    'breed' => $petSnapshot['breed'] ?? null,
                ],
                'owner' => [
                    'name' => $ownerSnapshot['fullName'] ?? null,
                    'phone' => $ownerSnapshot['phone'] ?? null,
                    'email' => $ownerSnapshot['email'] ?? null,
                ],
                'clinic' => [
                    'name' => $clinicDocument['name'] ?? null,
                    'address' => $clinicDocument['address'] ?? null,
                    'phone' => $clinicDocument['phone'] ?? null,
                ],
                'appointmentDate' => $appointmentAt->toIso8601String(),
                'arrivalTime' => $arrivalTime->toIso8601String(),
                'type' => $appointmentType,
                'reason' => $reason,
                'duration' => $duration,
                'status' => 'scheduled',
            ],
        ];

        if ($this->chatSession->globalSessionId !== null) {
            $this->eventPublisher->publishAppointmentBooked(
                $this->chatSession->globalSessionId,
                $response,
            );
        }

        return json_encode(
            $response,
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE,
        );
    }

    private function generateAppointmentId(): string
    {
        $year = now()->year;
        $random = random_int(100000, 999999);

        return "APPT-{$year}-{$random}";
    }

    private function generateConfirmationNumber(string $clinicId, CarbonInterface $appointmentAt): string
    {
        $clinicCode = Str::afterLast($clinicId, '-');
        if ($clinicCode === '' || $clinicCode === $clinicId) {
            $clinicCode = 'VET';
        }

        $dateCode = $appointmentAt->format('Ymd');
        $randomCode = random_int(100, 999);

        return "{$clinicCode}-{$dateCode}-{$randomCode}";
    }

    /**
     * @param  array<string, mixed>  $petInfo
     * @return array<string, mixed>
     */
    private function petSnapshot(array $petInfo, string $petId): array
    {
        return array_filter([
            'id' => $petId,
            'name' => $petInfo['name'] ?? null,
            'species' => $petInfo['species'] ?? null,
            'breed' => $petInfo['breed'] ?? null,
            'sex' => $petInfo['sex'] ?? null,
            'dateOfBirth' => $petInfo['dateOfBirth'] ?? null,
            'ageMonths' => $petInfo['ageMonths'] ?? null,
            'weight' => $petInfo['weight'] ?? null,
            'microchip' => $petInfo['microchip'] ?? null,
            'spayedNeutered' => $petInfo['spayedNeutered'] ?? null,
            'allergies' => $petInfo['allergies'] ?? [],
            'conditions' => $petInfo['conditions'] ?? [],
            'vaccinations' => $petInfo['vaccinations'] ?? [],
        ], fn ($value) => $value !== null);
    }

    /**
     * @param  array<string, mixed>  $ownerInfo
     * @return array<string, mixed>
     */
    private function ownerSnapshot(array $ownerInfo): array
    {
        return array_filter([
            'id' => $ownerInfo['id'] ?? null,
            'fullName' => $ownerInfo['fullName'] ?? null,
            'phone' => $ownerInfo['phone'] ?? null,
            'email' => $ownerInfo['email'] ?? null,
            'address' => $ownerInfo['address'] ?? null,
        ], fn ($value) => $value !== null);
    }

    private function errorResponse(string $message): string
    {
        return json_encode([
            'success' => false,
            'error' => $message,
            'message' => $message,
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    }
}
