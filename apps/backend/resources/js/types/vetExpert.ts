export interface Pet {
    id: string;
    name: string;
    species: string;
    age: string;
    gender: string;
    avatar: string;
    policyId: string;
    coveragePlan: string;
}

export interface Vaccination {
    id: string;
    name: string;
    status: 'completed' | 'due' | 'overdue';
}

export interface Appointment {
    id: string;
    title: string;
    location: string;
    date: string;
    time: string;
}

export interface ChatMessage {
    id: string;
    content: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
    type?: 'text' | 'confirmation' | 'choice' | 'form';
    metadata?: MessageMetadata;
    visible?: boolean;
    agentName?: string;
}

export interface MessageMetadata {
    confirmationOptions?: {
        yesLabel?: string;
        noLabel?: string;
        yesEvent: string;
        noEvent: string;
        eventPayload?: unknown;
    };
    choiceOptions?: {
        options: Array<{ label: string; value: string; event: string }>;
    };
}

export interface ChatSession {
    sessionId: string | null;
    lastMessageTimestamp?: Date;
}

export interface LogEntry {
    timestamp: string;
    level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
    message: string;
    [key: string]: unknown;
}

export interface ChatSideEffectEvent {
    type: string;
    id: string;
    timestamp: number;
    payload?: Record<string, unknown>;
}

export interface BackendChatResponse {
    message: string;
    data: {
        response: string;
        sessionId: string;
    };
    metadata: {
        requestId: string;
        timestamp: string;
        environment: string;
        logs?: LogEntry[];
        classification?: string;
        agentId?: string;
        events?: ChatSideEffectEvent[];
    };
}

export interface BackendErrorResponse {
    error: string;
    message: string;
    requestId?: string;
}

export interface QuickAction {
    id: string;
    label: string;
    color: string;
    prompt: string;
}

export interface ApiResponse<T = unknown> {
    data: T;
    status: number;
    statusText: string;
    headers: Headers;
    success: boolean;
    error?: string;
}

export interface ApiErrorShape {
    message: string;
    status: number;
    statusText: string;
    name: string;
}

export interface ChatRequest {
    message: string;
    conversationId?: string;
    userId?: string;
}

export interface ChatResponse {
    message: string;
    conversationId: string;
    suggestions?: string[];
    timestamp: string;
}

export interface PetCreateRequest {
    name: string;
    species: string;
    age: string;
    gender: string;
    avatar?: string;
    coveragePlan: string;
}

export interface PetUpdateRequest {
    name?: string;
    species?: string;
    age?: string;
    gender?: string;
    avatar?: string;
    coveragePlan?: string;
}

export interface PolicyResponse {
    id: string;
    petId: string;
    coveragePlan: string;
    status: 'active' | 'inactive' | 'pending';
    startDate: string;
    endDate: string;
    premium: number;
    deductible: number;
    coverageLimit: number;
}

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserUpdateRequest {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
}
