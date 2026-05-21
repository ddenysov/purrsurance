<?php

namespace App\Agents\Output;

use NeuronAI\StructuredOutput\SchemaProperty;

class PolicyDisplaySummary
{
    public function __construct(
        #[SchemaProperty(description: 'Owner full name from policy data.', required: false)]
        public ?string $ownerName = null,
        #[SchemaProperty(description: 'Pet name from policy data.', required: true)]
        public string $petName = '',
        #[SchemaProperty(description: 'Insurance plan name.', required: false)]
        public ?string $plan = null,
        #[SchemaProperty(description: 'Policy status: active, inactive, pending, or expired.', required: false)]
        public ?string $status = null,
    ) {}
}
