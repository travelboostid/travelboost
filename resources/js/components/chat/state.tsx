import { useOpenChatRoom } from '@/api/chat-room/chat-room';
import type { ChatMessageResource, ChatRoomResource } from '@/api/model';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import {
    selectChatRooms,
    selectMessage,
    selectRoom,
    selectRoomMessages,
    selectRoomPagination,
    selectRoomSending,
    selectRoomsStatus,
    useChatStore,
} from '@/stores/chat/chat-store';
import { useChatUiStore } from '@/stores/chat/chat-ui-store';
import type { Attachment, ChatActor } from '@/stores/chat/types';
import { useEcho, useEchoPublic } from '@laravel/echo-react';
import { MessageSquareIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { useAnonymousUserContext } from '../anonymous-user-context-provider';

export type { Attachment, ChatActor };

function notifyIncomingMessage(
    message: ChatMessageResource,
    actor: ChatActor | null,
): void {
    if (actor?.type === message.sender_type && actor.id === message.sender_id) {
        return;
    }

    toast(message.sender?.name ?? 'New message', {
        description: <p className="line-clamp-1">{message.message || '???'}</p>,
        icon: <MessageSquareIcon />,
        position: 'top-center',
    });
}

function AuthenticatedChatMessageListener() {
    const { auth } = usePageSharedDataProps();
    const actor = useChatStore((state) => state.actor);
    const upsertMessage = useChatStore((state) => state.upsertMessage);
    const upsertRoom = useChatStore((state) => state.upsertRoom);
    const channelName = `users.${auth?.user?.id}`;

    useEcho(
        channelName,
        '.ChatMessageCreated',
        (event: ChatMessageResource) => {
            upsertMessage(event);
            notifyIncomingMessage(event, actor);
        },
        [channelName, actor, upsertMessage],
    );

    useEcho(
        channelName,
        '.ChatRoomUpdated',
        (event: { room: ChatRoomResource }) => {
            upsertRoom(event.room);
        },
        [channelName, upsertRoom],
    );

    useEcho(
        channelName,
        '.ChatRoomCreated',
        (event: { room: ChatRoomResource }) => {
            upsertRoom(event.room);
        },
        [channelName, upsertRoom],
    );

    return null;
}

function UnauthenticatedChatMessageListener() {
    const actor = useChatStore((state) => state.actor);
    const upsertMessage = useChatStore((state) => state.upsertMessage);
    const upsertRoom = useChatStore((state) => state.upsertRoom);
    const anonymousUser = useAnonymousUserContext();
    const channelName = `anonymous-users.${anonymousUser?.id}`;

    useEchoPublic(
        channelName,
        '.ChatMessageCreated',
        (event: ChatMessageResource) => {
            upsertMessage(event);
            notifyIncomingMessage(event, actor);
        },
    );

    useEchoPublic(
        channelName,
        '.ChatRoomUpdated',
        (event: { room: ChatRoomResource }) => {
            upsertRoom(event.room);
        },
    );

    useEchoPublic(
        channelName,
        '.ChatRoomCreated',
        (event: { room: ChatRoomResource }) => {
            upsertRoom(event.room);
        },
    );

    return null;
}

export function ChatContextProvider({
    children,
    actor,
}: {
    children: ReactNode;
    actor: ChatActor;
}) {
    const { auth } = usePageSharedDataProps();
    const setActor = useChatStore((state) => state.setActor);
    const reset = useChatStore((state) => state.reset);

    useLayoutEffect(() => {
        setActor(actor);
    }, [actor, setActor]);

    useEffect(() => {
        return () => {
            reset();
        };
    }, [reset]);

    return (
        <>
            {auth?.user ? (
                <AuthenticatedChatMessageListener />
            ) : (
                <UnauthenticatedChatMessageListener />
            )}
            {children}
        </>
    );
}

function setMessageById(
    updater:
        | Record<number, ChatMessageResource>
        | ((
              current: Record<number, ChatMessageResource>,
          ) => Record<number, ChatMessageResource>),
): void {
    const current = useChatStore.getState().messageById;
    const next = typeof updater === 'function' ? updater(current) : updater;

    useChatStore.getState().upsertMessages(Object.values(next));
}

function setRoomById(
    updater:
        | Record<number, ChatRoomResource>
        | ((
              current: Record<number, ChatRoomResource>,
          ) => Record<number, ChatRoomResource>),
): void {
    const current = useChatStore.getState().roomById;
    const next = typeof updater === 'function' ? updater(current) : updater;

    useChatStore.getState().upsertRooms(Object.values(next));
}

export function useChatActor() {
    return useChatStore((state) => state.actor);
}

export function useChatContext() {
    const context = useChatStore(
        useShallow((state) => ({
            actor: state.actor,
            roomById: state.roomById,
            messageById: state.messageById,
            sendMessage: state.sendMessage,
            loadMessages: state.loadMessages,
            loadRoom: state.loadRoom,
            loadRooms: state.loadRooms,
        })),
    );

    return {
        ...context,
        setMessageById,
        setRoomById,
    };
}

export function useLoadMessages() {
    return useChatStore((state) => state.loadMessages);
}

export function useLoadRoom() {
    return useChatStore((state) => state.loadRoom);
}

export function useLoadRooms() {
    return useChatStore((state) => state.loadRooms);
}

export function useSendMessage() {
    return useChatStore((state) => state.sendMessage);
}

export function useRoomMessages(roomId: number) {
    return useChatStore(
        useShallow((state) => selectRoomMessages(state, roomId)),
    );
}

export function useChatRooms() {
    return useChatStore(useShallow(selectChatRooms));
}

export function useChatRoom(roomId: number) {
    return useChatStore((state) => selectRoom(state, roomId));
}

export function useMessage(messageId: number) {
    return useChatStore((state) => selectMessage(state, messageId));
}

export function useRoomPagination(roomId: number) {
    return useChatStore(
        useShallow((state) => selectRoomPagination(state, roomId)),
    );
}

export function useRoomSending(roomId: number) {
    return useChatStore((state) => selectRoomSending(state, roomId));
}

export function useRoomsStatus() {
    return useChatStore(useShallow(selectRoomsStatus));
}

export function useClearRoomError() {
    return useChatStore((state) => state.clearRoomError);
}

export function useClearRoomsError() {
    return useChatStore((state) => state.clearRoomsError);
}

export function useStartPrivateChat() {
    const upsertRoom = useChatStore((state) => state.upsertRoom);
    const openChatRoom = useOpenChatRoom();
    const setAttachment = useChatUiStore((state) => state.setAttachment);
    const setRoomId = useChatUiStore((state) => state.setRoomId);
    const setOpen = useChatUiStore((state) => state.setOpen);

    return useCallback(
        async (
            recipient: ChatActor,
            attachment?: Attachment | null,
        ): Promise<void> => {
            if (attachment) {
                setAttachment(attachment);
            }

            const actor = useChatStore.getState().actor;

            if (!actor?.id) {
                throw new Error('Chat actor is not initialized.');
            }

            const result = await openChatRoom.mutateAsync({
                data: {
                    sender_id: actor.id,
                    sender_type: actor.type,
                    recipient_id: recipient.id,
                    recipient_type: recipient.type,
                },
            });

            upsertRoom(result.data);
            setRoomId(result.data.id);
            setOpen(true);
        },
        [openChatRoom, setAttachment, setOpen, setRoomId, upsertRoom],
    );
}

export function FloatingChatWidgetContextProvider({
    children,
}: {
    children: ReactNode;
}) {
    return <>{children}</>;
}

export function useFloatingChatWidgetContext() {
    const ui = useChatUiStore(
        useShallow((state) => ({
            open: state.open,
            setOpen: state.setOpen,
            roomId: state.roomId,
            setRoomId: state.setRoomId,
            message: state.message,
            setMessage: state.setMessage,
            attachment: state.attachment,
            setAttachment: state.setAttachment,
        })),
    );
    const startPrivateChat = useStartPrivateChat();

    return {
        ...ui,
        startPrivateChat,
    };
}
