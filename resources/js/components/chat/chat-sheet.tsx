import { Sheet, SheetContent } from '@/components/ui/sheet';
import { DEFAULT_PHOTO } from '@/config';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { IconUsersGroup } from '@tabler/icons-react';
import { ChevronLeftIcon, UserIcon } from 'lucide-react';
import {
    Avatar,
    AvatarFallback,
    AvatarGroupCount,
    AvatarImage,
} from '../ui/avatar';
import ChatBox from './chat-box';
import ChatInput from './chat-input';
import ChatList from './chat-list';
import { ChatHeaderSkeleton } from './chat-status';
import {
    useChatActor,
    useChatRoom,
    useFloatingChatWidgetContext,
} from './state';

function GroupChatHeader() {
    const { roomId, setRoomId, setAttachment } = useFloatingChatWidgetContext();
    const room = useChatRoom(roomId);

    const handleExitRoom = () => {
        setRoomId(0);
        setAttachment(null);
    };

    if (!room) {
        return <ChatHeaderSkeleton />;
    }

    return (
        <div className="flex shrink-0 items-center gap-3 border-b p-4">
            <button
                className="shrink-0 rounded-md p-1 transition-colors hover:bg-muted"
                type="button"
                onClick={handleExitRoom}
                aria-label="Back to conversations"
            >
                <ChevronLeftIcon className="size-5" />
            </button>
            <div className="shrink-0">
                <AvatarGroupCount>
                    <IconUsersGroup />
                </AvatarGroupCount>
            </div>
            <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">
                    {room.name || 'Unnamed Group'}
                </div>
                <div className="text-xs text-muted-foreground">
                    {room.members?.length ?? 0} participants
                </div>
            </div>
        </div>
    );
}

function PrivateChatHeader() {
    const actor = useChatActor();
    const { setAttachment, roomId, setRoomId } = useFloatingChatWidgetContext();
    const room = useChatRoom(roomId);

    const partner = room?.members?.find(
        (member) =>
            member?.member_type !== actor?.type ||
            member?.member_id !== actor?.id,
    ) as any;

    const partnerPhoto = partner?.member?.photo_url || DEFAULT_PHOTO;

    const handleExitRoom = () => {
        setRoomId(0);
        setAttachment(null);
    };

    if (!room) {
        return <ChatHeaderSkeleton />;
    }

    return (
        <div className="flex shrink-0 items-center gap-3 border-b p-4">
            <button
                className="shrink-0 rounded-md p-1 transition-colors hover:bg-muted"
                type="button"
                onClick={handleExitRoom}
                aria-label="Back to conversations"
            >
                <ChevronLeftIcon className="size-5" />
            </button>
            <div className="shrink-0">
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
                <div className="truncate font-semibold">
                    {partner?.member?.name || 'User'}
                </div>
                <div className="text-xs text-muted-foreground">
                    Private chat
                </div>
            </div>
        </div>
    );
}

function ChatListHeader() {
    const { auth } = usePageSharedDataProps();
    const photoUrl = auth?.user?.photo_url || DEFAULT_PHOTO;

    return (
        <div className="flex shrink-0 items-center gap-3 border-b p-4">
            <div className="shrink-0">
                <Avatar>
                    <AvatarImage src={photoUrl} alt="Your profile" />
                    <AvatarFallback>
                        <UserIcon />
                    </AvatarFallback>
                </Avatar>
            </div>
            <div className="min-w-0 flex-1">
                <div className="font-semibold">Messages</div>
                <div className="text-xs text-muted-foreground">
                    Your conversations
                </div>
            </div>
        </div>
    );
}

function ChatHeader() {
    const { roomId } = useFloatingChatWidgetContext();
    const room = useChatRoom(roomId);

    if (!roomId) {
        return <ChatListHeader />;
    }

    if (!room) {
        return <ChatHeaderSkeleton />;
    }

    if (room.type === 'private') {
        return <PrivateChatHeader />;
    }

    if (room.type === 'group') {
        return <GroupChatHeader />;
    }

    return <ChatHeaderSkeleton />;
}

export default function ChatSheet() {
    const { open, setOpen, roomId } = useFloatingChatWidgetContext();

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="flex w-full min-h-screen flex-col gap-0 p-0 sm:max-w-120">
                <ChatHeader />
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="relative min-h-0 flex-1">
                        {roomId ? (
                            <ChatBox
                                roomId={roomId}
                                className="absolute inset-0 h-full w-full"
                            />
                        ) : (
                            <ChatList className="absolute inset-0 h-full w-full" />
                        )}
                    </div>
                    {!!roomId && (
                        <ChatInput
                            roomId={roomId}
                            className="shrink-0 border-t"
                        />
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
