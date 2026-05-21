<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VetClinic extends Model
{
    protected $primaryKey = 'clinic_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'clinic_id',
        'name',
        'address',
        'phone',
        'email',
        'specialty',
        'accepts_insurance',
        'city',
    ];

    protected function casts(): array
    {
        return [
            'address' => 'array',
            'accepts_insurance' => 'boolean',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toBookingDocument(): array
    {
        return [
            'id' => $this->clinic_id,
            'name' => $this->name,
            'address' => $this->address,
            'phone' => $this->phone,
            'email' => $this->email,
            'specialty' => $this->specialty,
            'acceptsInsurance' => $this->accepts_insurance,
        ];
    }
}
