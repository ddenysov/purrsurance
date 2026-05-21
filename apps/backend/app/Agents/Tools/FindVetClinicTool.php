<?php

namespace App\Agents\Tools;

use App\Models\VetClinic;
use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\Tool;
use NeuronAI\Tools\ToolProperty;

class FindVetClinicTool extends Tool
{
    private const EMERGENCY_SPECIALTY_MARKERS = [
        'екстрена',
        'emergency',
        'intensive',
        'інтенсивна',
    ];

    public function __construct()
    {
        parent::__construct(
            name: 'FindVetClinic',
            description: 'Searches partner veterinary clinics by city, specialty, and urgency. Returns clinic id, name, address, phone, email, specialty, and insurance acceptance.',
        );
    }

    /**
     * @return ToolProperty[]
     */
    protected function properties(): array
    {
        return [
            ToolProperty::make(
                name: 'city',
                type: PropertyType::STRING,
                description: 'City to search in (e.g. "Київ", "Львів"). Omit to search all cities.',
                required: false,
            ),
            ToolProperty::make(
                name: 'specialty',
                type: PropertyType::STRING,
                description: 'Desired clinic specialty or service (e.g. "Загальна практика", "Стоматологія", "Екстрена").',
                required: false,
            ),
            ToolProperty::make(
                name: 'urgency',
                type: PropertyType::STRING,
                description: 'Visit urgency: emergency (immediate), urgent (within 24h), normal, routine.',
                required: false,
                enum: ['emergency', 'urgent', 'normal', 'routine'],
            ),
        ];
    }

    public function __invoke(?string $city = null, ?string $specialty = null, ?string $urgency = null): string
    {
        $city = $city !== null ? trim($city) : '';
        $specialty = $specialty !== null ? trim($specialty) : '';
        $urgency = $urgency !== null && $urgency !== '' ? trim($urgency) : null;

        $query = VetClinic::query();

        if ($city !== '') {
            $query->where('city', 'like', '%'.$city.'%');
        }

        if ($specialty !== '') {
            $query->where('specialty', 'like', '%'.$specialty.'%');
        }

        $clinics = $query
            ->orderBy('city')
            ->orderBy('name')
            ->get();

        if (in_array($urgency, ['emergency', 'urgent'], true)) {
            $clinics = $clinics
                ->sortByDesc(fn (VetClinic $clinic) => $this->isEmergencySpecialty($clinic->specialty))
                ->values();
        }

        $documents = $clinics
            ->map(fn (VetClinic $clinic) => $clinic->toBookingDocument())
            ->values()
            ->all();

        $payload = [
            'success' => true,
            'totalCount' => count($documents),
            'count' => count($documents),
            'clinics' => $documents,
            'filters' => [
                'city' => $city !== '' ? $city : null,
                'specialty' => $specialty !== '' ? $specialty : null,
                'urgency' => $urgency,
            ],
            'timestamp' => now()->toIso8601String(),
        ];

        if (count($documents) === 0) {
            $payload['message'] = 'No clinics matched the search criteria. Try a broader city or specialty, or call without filters to list all partner clinics.';
        }

        return json_encode(
            $payload,
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE,
        );
    }

    private function isEmergencySpecialty(?string $specialty): bool
    {
        if ($specialty === null || $specialty === '') {
            return false;
        }

        $normalized = mb_strtolower($specialty);

        foreach (self::EMERGENCY_SPECIALTY_MARKERS as $marker) {
            if (str_contains($normalized, $marker)) {
                return true;
            }
        }

        return false;
    }
}
