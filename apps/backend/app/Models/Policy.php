<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Policy extends Model
{
    protected $primaryKey = 'policy_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'policy_id',
        'owner_id',
        'status',
        'pet',
        'owner',
        'policy_details',
        'medical',
    ];

    protected function casts(): array
    {
        return [
            'pet' => 'array',
            'owner' => 'array',
            'policy_details' => 'array',
            'medical' => 'array',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toDynamoDocument(): array
    {
        return [
            'policyId' => $this->policy_id,
            'ownerId' => $this->owner_id,
            'status' => $this->status,
            'pet' => $this->pet,
            'owner' => $this->owner,
            'policy' => $this->policy_details,
            'medical' => $this->medical,
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
