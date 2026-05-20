<?php

use App\Agents\BookingManagerAgent;
use App\Agents\PolicyManagerAgent;
use App\Agents\VetDocAgent;

return [

    /*
    |--------------------------------------------------------------------------
    | Agent routing (maps Intention Classifier output to agent classes)
    |--------------------------------------------------------------------------
    */

    'mapping' => [
        'PolicyAgent' => PolicyManagerAgent::class,
        'VetDocAgent' => VetDocAgent::class,
        'BookingAgent' => BookingManagerAgent::class,
    ],

    'classifications' => [
        'PolicyAgent',
        'VetDocAgent',
        'BookingAgent',
        'AgentNotFoundException',
    ],

    'fallback' => [
        'not_found' => 'Hello! I can help you with insurance policy information or veterinary consultations for your pet. How can I assist you today?',
        'unknown' => 'I apologize, but I\'m not sure how to help with that. Could you please rephrase your question? I can assist with insurance policies or pet health concerns.',
    ],

];
