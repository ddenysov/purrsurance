import type { BackendChatResponse, BackendErrorResponse } from '@/types';
import type { SharedClientConfig } from '@/types/client';
import { apiClient } from './apiClient';

function mockChatResponse(
    _message: string,
    bedrockSessionId: string | null,
): BackendChatResponse {
    const sessionId = bedrockSessionId || `session-${Date.now()}`;

    return {
        message: 'OK',
        data: {
            response:
                'Привіт! Я — Доктор Котик, ваш віртуальний ветеринарний консультант. ' +
                'За симптомами, які ви описали — підвищена температура вже другий день і тварина майже нічого не їсть — таке поєднання може вказувати на інфекційний процес, запалення або проблеми з травленням; точний діагноз без огляду й за потреби аналізів поставити не можна. ' +
                'Тому я прийняв рішення рекомендувати запис у ветеринарну клініку: на прийомі лікар огляне улюбленця, за потреби призначить обстеження й пояснить, що саме відбувається та як діяти далі.',
            sessionId,
        },
        metadata: {
            requestId: `req-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            timestamp: new Date().toISOString(),
            environment: 'development',
            classification: 'DoctorKotryAgent',
        },
    };
}

/**
 * Send message to backend chat API
 */
export async function sendChatMessage(
    message: string,
    bedrockSessionId: string | null = null,
    globalSessionId: string | null = null,
    policyId: string | null = null,
    chatHistory: Array<{ content: string; sender: 'user' | 'assistant' }> = [],
    client: SharedClientConfig,
): Promise<BackendChatResponse> {
    try {
        if (client.chatApiMock) {
            await new Promise((r) => setTimeout(r, 400));

            return mockChatResponse(message, bedrockSessionId);
        }

        const payload: {
            message: string;
            sessionId?: string;
            globalSessionId?: string;
            policyId?: string;
            chatHistory?: Array<{ content: string; sender: 'user' | 'assistant' }>;
        } = {
            message: message.trim(),
        };

        if (bedrockSessionId) {
            payload.sessionId = bedrockSessionId;
        }

        if (globalSessionId) {
            payload.globalSessionId = globalSessionId;
        }

        if (policyId) {
            payload.policyId = policyId;
        }

        if (chatHistory && chatHistory.length > 0) {
            payload.chatHistory = chatHistory;
        }

        console.log('Sending chat message:', {
            messageLength: message.length,
            hasBedrockSessionId: !!bedrockSessionId,
            hasGlobalSessionId: !!globalSessionId,
            hasPolicyId: !!policyId,
            historyLength: chatHistory.length,
        });

        const response = await apiClient.post<BackendChatResponse>(client.chatApiUrl, payload, {
            timeout: 30000,
        });

        console.log('Chat response received:', {
            requestId: response.data.metadata?.requestId,
            bedrockSessionId: response.data.data?.sessionId,
            responseLength: response.data.data?.response?.length,
            logsCount: response.data.metadata?.logs?.length,
        });

        if (response.data.metadata?.logs && response.data.metadata.logs.length > 0) {
            console.group(`Backend Logs (${response.data.metadata.logs.length} entries)`);
            response.data.metadata.logs.forEach((log) => {
                const logMethod =
                    log.level === 'ERROR'
                        ? 'error'
                        : log.level === 'WARN'
                          ? 'warn'
                          : log.level === 'DEBUG'
                            ? 'debug'
                            : 'log';
                console[logMethod](`[${log.timestamp}] ${log.message}`, log);
            });
            console.groupEnd();
        }

        if (!response.data?.data?.response) {
            throw new Error('Некоректна структура відповіді від сервера');
        }

        return response.data;
    } catch (error: unknown) {
        console.error('Chat API error:', error);

        if (error && typeof error === 'object' && 'response' in error) {
            const err = error as { response?: { data?: BackendErrorResponse; status?: number } };
            const errorData = err.response?.data;

            throw new Error(errorData?.message || `Помилка сервера: ${err.response?.status}`);
        }

        if (error && typeof error === 'object' && 'request' in error) {
            throw new Error('Немає відповіді від сервера. Перевірте з’єднання й спробуйте ще раз.');
        }

        const messageText = error instanceof Error ? error.message : 'Не вдалося надіслати повідомлення. Спробуйте ще раз.';

        throw new Error(messageText);
    }
}

export async function testBackendConnection(client: SharedClientConfig): Promise<boolean> {
    try {
        await sendChatMessage('Hello', null, null, null, [], client);

        return true;
    } catch {
        return false;
    }
}

export function getChatAPIStatus(client: SharedClientConfig) {
    return {
        fullUrl: client.chatApiUrl,
        timeout: 30000,
    };
}
