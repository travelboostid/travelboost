import {
    createChatMessage,
    getChatMessages,
} from '@/api/chat-message/chat-message';
import { getChatRoom, getChatRooms } from '@/api/chat-room/chat-room';
import type {
    ChatMessageResource,
    ChatRoomResource,
    GetChatMessages200,
    GetChatMessagesParams,
    GetChatRoomsParams,
    StoreChatMessageRequest,
} from '@/api/model';
import { formatChatError } from '@/stores/chat/chat-error';
import { sortMessageIds } from '@/stores/chat/chat-helpers';
import type {
    ChatActor,
    RoomPagination,
    RoomsStatus,
} from '@/stores/chat/types';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type ChatStoreState = {
    actor: ChatActor | null;
    roomById: Record<number, ChatRoomResource>;
    messageById: Record<number, ChatMessageResource>;
    messageIdsByRoom: Record<number, number[]>;
    paginationByRoom: Record<number, RoomPagination>;
    sendingByRoom: Record<number, boolean>;
    roomsStatus: RoomsStatus;
};

type ChatStoreActions = {
    setActor: (actor: ChatActor) => void;
    reset: () => void;
    upsertMessage: (message: ChatMessageResource) => void;
    upsertMessages: (messages: ChatMessageResource[]) => void;
    upsertRoom: (room: ChatRoomResource) => void;
    upsertRooms: (rooms: ChatRoomResource[]) => void;
    setRoomPagination: (
        roomId: number,
        pagination: Partial<RoomPagination>,
    ) => void;
    resetRoomPagination: (roomId: number) => void;
    setSending: (roomId: number, sending: boolean) => void;
    clearRoomError: (roomId: number) => void;
    clearRoomsError: () => void;
    sendMessage: (
        roomId: number,
        dto: StoreChatMessageRequest,
    ) => Promise<ChatMessageResource>;
    loadMessages: (
        roomId: number,
        options: GetChatMessagesParams,
    ) => Promise<GetChatMessages200>;
    loadRoom: (roomId: number) => Promise<ChatRoomResource>;
    loadRooms: (options: GetChatRoomsParams) => Promise<ChatRoomResource[]>;
};

export type ChatStore = ChatStoreState & ChatStoreActions;

const initialState: ChatStoreState = {
    actor: null,
    roomById: {},
    messageById: {},
    messageIdsByRoom: {},
    paginationByRoom: {},
    sendingByRoom: {},
    roomsStatus: {
        isLoading: false,
        error: null,
        hasLoaded: false,
    },
};

function indexMessage(
    state: ChatStoreState,
    message: ChatMessageResource,
): void {
    state.messageById[message.id] = {
        ...state.messageById[message.id],
        ...message,
    };

    const roomId = message.room_id;
    const roomMessageIds = state.messageIdsByRoom[roomId] ?? [];

    if (!roomMessageIds.includes(message.id)) {
        roomMessageIds.push(message.id);
    }

    state.messageIdsByRoom[roomId] = sortMessageIds(
        state.messageById,
        roomMessageIds,
    );
}

export const useChatStore = create<ChatStore>()(
    immer((set, get) => ({
        ...initialState,

        setActor: (actor) => {
            set((state) => {
                if (
                    state.actor?.type === actor.type &&
                    state.actor?.id === actor.id
                ) {
                    return;
                }

                state.actor = actor;
            });
        },

        reset: () => {
            set(initialState);
        },

        upsertMessage: (message) => {
            set((state) => {
                indexMessage(state, message);
            });
        },

        upsertMessages: (messages) => {
            set((state) => {
                for (const message of messages) {
                    indexMessage(state, message);
                }
            });
        },

        upsertRoom: (room) => {
            set((state) => {
                state.roomById[room.id] = {
                    ...state.roomById[room.id],
                    ...room,
                };
            });
        },

        upsertRooms: (rooms) => {
            set((state) => {
                for (const room of rooms) {
                    state.roomById[room.id] = {
                        ...state.roomById[room.id],
                        ...room,
                    };
                }
            });
        },

        setRoomPagination: (roomId, pagination) => {
            set((state) => {
                const current = state.paginationByRoom[roomId];

                state.paginationByRoom[roomId] = {
                    nextCursor:
                        pagination.nextCursor ?? current?.nextCursor ?? null,
                    isLoading:
                        pagination.isLoading ?? current?.isLoading ?? false,
                    error:
                        pagination.error !== undefined
                            ? pagination.error
                            : (current?.error ?? null),
                    hasLoaded:
                        pagination.hasLoaded ?? current?.hasLoaded ?? false,
                };
            });
        },

        resetRoomPagination: (roomId) => {
            set((state) => {
                state.paginationByRoom[roomId] = {
                    nextCursor: null,
                    isLoading: false,
                    error: null,
                    hasLoaded: false,
                };
            });
        },

        clearRoomError: (roomId) => {
            set((state) => {
                const current = state.paginationByRoom[roomId];

                if (!current) {
                    return;
                }

                current.error = null;
            });
        },

        clearRoomsError: () => {
            set((state) => {
                state.roomsStatus.error = null;
            });
        },

        setSending: (roomId, sending) => {
            set((state) => {
                state.sendingByRoom[roomId] = sending;
            });
        },

        sendMessage: async (roomId, dto) => {
            get().setSending(roomId, true);

            try {
                const result = await createChatMessage(roomId.toString(), dto);
                get().upsertMessage(result.data);

                return result.data;
            } finally {
                get().setSending(roomId, false);
            }
        },

        loadMessages: async (roomId, options) => {
            get().setRoomPagination(roomId, { isLoading: true });

            try {
                const result = await getChatMessages(
                    roomId.toString(),
                    options,
                );
                get().upsertMessages(result.data);
                get().setRoomPagination(roomId, {
                    nextCursor: result.meta?.next_cursor ?? '',
                    isLoading: false,
                    error: null,
                    hasLoaded: true,
                });

                return result;
            } catch (error) {
                get().setRoomPagination(roomId, {
                    isLoading: false,
                    error: formatChatError(error),
                });
                throw error;
            }
        },

        loadRoom: async (roomId) => {
            const result = await getChatRoom(roomId);
            get().upsertRoom(result.data);

            return result.data;
        },

        loadRooms: async (options) => {
            set((state) => {
                state.roomsStatus.isLoading = true;
                state.roomsStatus.error = null;
            });

            try {
                const result = await getChatRooms(options);
                get().upsertRooms(result.data);
                set((state) => {
                    state.roomsStatus.isLoading = false;
                    state.roomsStatus.hasLoaded = true;
                    state.roomsStatus.error = null;
                });

                return result.data;
            } catch (error) {
                set((state) => {
                    state.roomsStatus.isLoading = false;
                    state.roomsStatus.hasLoaded = true;
                    state.roomsStatus.error = formatChatError(error);
                });
                throw error;
            }
        },
    })),
);

export function selectChatRooms(state: ChatStore): ChatRoomResource[] {
    return Object.values(state.roomById).sort(
        (left, right) =>
            new Date(right.updated_at ?? 0).getTime() -
            new Date(left.updated_at ?? 0).getTime(),
    );
}

export function selectRoomMessages(
    state: ChatStore,
    roomId: number,
): ChatMessageResource[] {
    return (state.messageIdsByRoom[roomId] ?? [])
        .map((messageId) => state.messageById[messageId])
        .filter(
            (message): message is ChatMessageResource => message !== undefined,
        );
}

export function selectRoom(
    state: ChatStore,
    roomId: number,
): ChatRoomResource | undefined {
    return state.roomById[roomId];
}

export function selectMessage(
    state: ChatStore,
    messageId: number,
): ChatMessageResource | undefined {
    return state.messageById[messageId];
}

export function selectRoomSending(state: ChatStore, roomId: number): boolean {
    return state.sendingByRoom[roomId] ?? false;
}

export function selectRoomPagination(
    state: ChatStore,
    roomId: number,
): RoomPagination {
    return (
        state.paginationByRoom[roomId] ?? {
            nextCursor: null,
            isLoading: false,
            error: null,
            hasLoaded: false,
        }
    );
}

export function selectRoomsStatus(state: ChatStore): RoomsStatus {
    return state.roomsStatus;
}
