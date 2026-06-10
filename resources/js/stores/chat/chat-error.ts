import { ApiError } from '@/api/api-instance';

export function formatChatError(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.details && typeof error.details === 'object') {
            const firstMessage = Object.values(error.details)
                .flat()
                .find((value): value is string => typeof value === 'string');

            if (firstMessage) {
                return firstMessage;
            }
        }

        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'Something went wrong. Please try again.';
}
