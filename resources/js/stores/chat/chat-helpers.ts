import type { ChatMessageResource } from '@/api/model';

export function compareMessagesByCreatedAt(
    messageById: Record<number, ChatMessageResource>,
    leftId: number,
    rightId: number,
): number {
    const leftTime = new Date(messageById[leftId]?.created_at ?? 0).getTime();
    const rightTime = new Date(messageById[rightId]?.created_at ?? 0).getTime();

    if (leftTime !== rightTime) {
        return leftTime - rightTime;
    }

    return leftId - rightId;
}

export function sortMessageIds(
    messageById: Record<number, ChatMessageResource>,
    messageIds: number[],
): number[] {
    return [...messageIds].sort((leftId, rightId) =>
        compareMessagesByCreatedAt(messageById, leftId, rightId),
    );
}
