import type { Attachment } from '@/stores/chat/types';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type ChatUiStoreState = {
    open: boolean;
    roomId: number;
    message: string;
    attachment: Attachment | null;
};

type ChatUiStoreActions = {
    setOpen: (open: boolean) => void;
    setRoomId: (roomId: number) => void;
    setMessage: (message: string) => void;
    setAttachment: (attachment: Attachment | null) => void;
    clearDraft: () => void;
    exitRoom: () => void;
    reset: () => void;
};

export type ChatUiStore = ChatUiStoreState & ChatUiStoreActions;

const initialState: ChatUiStoreState = {
    open: false,
    roomId: 0,
    message: '',
    attachment: null,
};

export const useChatUiStore = create<ChatUiStore>()(
    immer((set) => ({
        ...initialState,

        setOpen: (open) => {
            set((state) => {
                state.open = open;
            });
        },

        setRoomId: (roomId) => {
            set((state) => {
                state.roomId = roomId;
            });
        },

        setMessage: (message) => {
            set((state) => {
                state.message = message;
            });
        },

        setAttachment: (attachment) => {
            set((state) => {
                state.attachment = attachment;
            });
        },

        clearDraft: () => {
            set((state) => {
                state.message = '';
                state.attachment = null;
            });
        },

        exitRoom: () => {
            set((state) => {
                state.roomId = 0;
                state.attachment = null;
            });
        },

        reset: () => {
            set(initialState);
        },
    })),
);
