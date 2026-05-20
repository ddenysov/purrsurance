<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'min:1'],
            'sessionId' => ['nullable', 'string'],
            'globalSessionId' => ['nullable', 'string'],
            'policyId' => ['nullable', 'string'],
            'chatHistory' => ['nullable', 'array'],
            'chatHistory.*.content' => ['required_with:chatHistory', 'string'],
            'chatHistory.*.sender' => ['required_with:chatHistory', 'string', 'in:user,assistant'],
        ];
    }
}
