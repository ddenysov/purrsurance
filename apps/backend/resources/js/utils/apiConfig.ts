/**
 * API configuration helpers (legacy). Prefer `page.props.client` from Inertia for URLs.
 */

const env = import.meta.env;

export const apiConfig = {
    get baseURL() {
        return (env.VITE_API_BASE_URL as string | undefined) || '/api';
    },

    get timeout() {
        return parseInt((env.VITE_API_TIMEOUT as string | undefined) || '10000', 10);
    },

    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },

    get sseStreamUrl() {
        return (env.VITE_SSE_STREAM_URL as string | undefined) || '/stream';
    },

    endpoints: {
        auth: {
            login: '/auth/login',
            register: '/auth/register',
            logout: '/auth/logout',
            refresh: '/auth/refresh',
            forgotPassword: '/auth/forgot-password',
            resetPassword: '/auth/reset-password',
        },
        chat: {
            messages: '/chat/messages',
            conversations: '/chat/conversations',
            userConversations: '/chat/users',
        },
        pets: {
            list: '/pets',
            create: '/pets',
            update: '/pets',
            delete: '/pets',
            avatar: '/pets/avatar',
        },
        policies: {
            list: '/policies',
            create: '/policies',
            update: '/policies',
            cancel: '/policies/cancel',
        },
        users: {
            profile: '/users',
            avatar: '/users/avatar',
        },
    },
};

export const getEndpointUrl = (endpoint: string): string => {
    return `${apiConfig.baseURL}${endpoint}`;
};
