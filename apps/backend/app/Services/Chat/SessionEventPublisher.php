<?php

namespace App\Services\Chat;

use Illuminate\Support\Facades\Log;

class SessionEventPublisher
{
    /** Matches AWS tool + frontend listener (typo preserved). */
    public const EVENT_RECOMMEND_DOCTOR_VISIT = 'ReccomendDoctorVisit';

    public const EVENT_POLICY_DETAILS_RETRIEVED = 'PolicyDetailsRetrieved';

    public const EVENT_APPOINTMENT_BOOKED = 'AppointmentBooked';

    public function __construct(
        private readonly SessionEventCollector $collector,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function publish(string $sessionId, string $eventType, array $data): void
    {
        if ($sessionId === '') {
            Log::warning('Chat event skipped: empty sessionId', ['eventType' => $eventType]);

            return;
        }

        $timestamp = $this->collector->push($eventType, [
            'eventType' => $eventType,
            'timestamp' => (int) round(microtime(true) * 1000),
            'data' => $data,
        ]);

        Log::info('Chat event published', [
            'sessionId' => $sessionId,
            'eventType' => $eventType,
            'timestamp' => $timestamp,
        ]);
    }

    /**
     * @param  array<string, mixed>  $toolPayload  Decoded JSON from RecommendDoctorVisit tool.
     */
    public function publishRecommendDoctorVisit(string $sessionId, array $toolPayload): void
    {
        $message = null;
        if (isset($toolPayload['recommendation']) && is_array($toolPayload['recommendation'])) {
            $message = $toolPayload['recommendation']['message'] ?? null;
        }

        $data = $toolPayload;
        if (is_string($message) && $message !== '') {
            $data['message'] = $message;
        }

        $this->publish($sessionId, self::EVENT_RECOMMEND_DOCTOR_VISIT, $data);
    }

    /**
     * @param  array<string, mixed>  $policyPayload  Pet, owner, policy, medical, etc.
     */
    public function publishPolicyDetailsRetrieved(string $sessionId, array $policyPayload): void
    {
        $this->publish($sessionId, self::EVENT_POLICY_DETAILS_RETRIEVED, $policyPayload);
    }

    /**
     * @param  array<string, mixed>  $appointmentPayload  Decoded JSON from BookVetClinic tool.
     */
    public function publishAppointmentBooked(string $sessionId, array $appointmentPayload): void
    {
        $this->publish($sessionId, self::EVENT_APPOINTMENT_BOOKED, $appointmentPayload);
    }
}
