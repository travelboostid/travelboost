import type { ChatRoomResource } from '@/api/model';
import { DEFAULT_PHOTO } from '@/config';
import { cn } from '@/lib/utils';
import { IconUsersGroup } from '@tabler/icons-react';
import { UserIcon } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import {
    Avatar,
    AvatarFallback,
    AvatarGroupCount,
    AvatarImage,
} from '../ui/avatar';
import {
    ChatEmptyRooms,
    ChatErrorPanel,
    ChatRoomListSkeleton,
} from './chat-status';
import {
    useChatActor,
    useChatRooms,
    useClearRoomsError,
    useFloatingChatWidgetContext,
    useLoadRooms,
    useRoomsStatus,
} from './state';

function PrivateRoomItem({ room }: { room: ChatRoomResource }) {
    const actor = useChatActor();
    const { setRoomId } = useFloatingChatWidgetContext();
    const partner = room?.members?.find(
        (member) =>
            member?.member_type !== actor?.type ||
            member?.member_id !== actor?.id,
    ) as any;
    const partnerPhoto = partner?.member?.photo_url || DEFAULT_PHOTO;

    return (
        <button
            type="button"
            className="flex w-full gap-3 p-4 text-left transition-colors hover:bg-muted/50"
            onClick={() => setRoomId(room.id)}
        >
            <div className="flex-none">
                <Avatar>
                    <AvatarImage
                        src={partnerPhoto}
                        alt={partner?.member?.name || 'User'}
                    />
                    <AvatarFallback>
                        <UserIcon />
                    </AvatarFallback>
                </Avatar>
            </div>
            <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                    {partner?.member?.name || 'User'}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                    {room.last_message?.message || 'No messages yet'}
                </div>
            </div>
        </button>
    );
}

function GroupRoomItem({ room }: { room: ChatRoomResource }) {
    const { setRoomId } = useFloatingChatWidgetContext();

    return (
        <button
            type="button"
            className="flex w-full gap-3 p-4 text-left transition-colors hover:bg-muted/50"
            onClick={() => setRoomId(room.id)}
        >
            <div className="flex-none">
                <AvatarGroupCount>
                    <IconUsersGroup />
                </AvatarGroupCount>
            </div>
            <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{room.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                    {room.last_message?.message || 'No messages yet'}
                </div>
            </div>
        </button>
    );
}

function RoomItem({ room }: { room: ChatRoomResource }) {
    return room.type === 'private' ? (
        <PrivateRoomItem room={room} />
    ) : (
        <GroupRoomItem room={room} />
    );
}

export default function ChatList({ className }: { className?: string }) {
    const actor = useChatActor();
    const loadRooms = useLoadRooms();
    const clearRoomsError = useClearRoomsError();
    const rooms = useChatRooms();
    const { isLoading, error, hasLoaded } = useRoomsStatus();

    const fetchRooms = useCallback(() => {
        if (!actor?.id) {
            return;
        }

        void loadRooms({
            per_page: 100,
            member_type: actor.type,
            member_id: actor.id,
        });
    }, [actor, loadRooms]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const handleRetry = () => {
        clearRoomsError();
        fetchRooms();
    };

    if (isLoading && !hasLoaded) {
        return <ChatRoomListSkeleton className={className} />;
    }

    if (error && !rooms.length) {
        return (
            <ChatErrorPanel
                title="Could not load conversations"
                message={error}
                onRetry={handleRetry}
                className={className}
            />
        );
    }

    if (hasLoaded && !rooms.length) {
        return <ChatEmptyRooms className={className} />;
    }

    return (
        <div className={cn('divide-y overflow-y-auto', className)}>
            {error && (
                <div className="border-b bg-destructive/5 px-4 py-2 text-xs text-destructive">
                    {error}
                </div>
            )}
            {rooms.map((room) => (
                <RoomItem key={room.id} room={room} />
            ))}
        </div>
    );
}
