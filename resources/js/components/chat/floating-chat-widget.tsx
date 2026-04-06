import { Sheet, SheetContent } from '@/components/ui/sheet';
import { DEFAULT_PHOTO } from '@/config';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import { IconBrandWhatsapp, IconUsersGroup } from '@tabler/icons-react';
import { ChevronLeftIcon, MessageSquareIcon, UserIcon } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarGroupCount,
  AvatarImage,
} from '../ui/avatar';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import ChatBox from './chat-box';
import ChatInput from './chat-input';
import ChatList from './chat-list';
import { useChatRoom, useFloatingChatWidgetContext } from './state';

function GroupChatHeader() {
  const { roomId, setRoomId, setAttachment } = useFloatingChatWidgetContext();
  const room = useChatRoom(roomId);
  const handleExitRoom = () => {
    setRoomId(0);
    setAttachment(null);
  };

  return (
    <div className="flex flex-0 items-center gap-2 border-b p-4">
      <button className="flex-0" type="button" onClick={handleExitRoom}>
        <ChevronLeftIcon />
      </button>
      <div className="flex-0">
        <AvatarGroupCount>
          <IconUsersGroup />
        </AvatarGroupCount>
      </div>
      <div className="flex-1">
        <div className="font-bold">{room?.name || 'Unnamed Group'}</div>
        <div className="text-xs text-muted-foreground">
          {room?.members?.length} participants
        </div>
      </div>
    </div>
  );
}

function PrivateChatHeader() {
  const { actor } = useFloatingChatWidgetContext();
  const { setAttachment, roomId, setRoomId } = useFloatingChatWidgetContext();
  const room = useChatRoom(roomId);

  const partner = room?.members?.find(
    (member) =>
      member?.member_type !== actor?.type || member?.member_id !== actor?.id,
  ) as any;

  console.log('partner', room.members, actor);

  const partnerPhoto = partner?.member?.photo_url || DEFAULT_PHOTO;

  const handleExitRoom = () => {
    setRoomId(0);
    setAttachment(null);
  };
  return (
    <div className="flex flex-0 items-center gap-2 border-b p-4">
      <button className="flex-0" type="button" onClick={handleExitRoom}>
        <ChevronLeftIcon />
      </button>
      <div className="flex-0">
        <Avatar>
          <AvatarImage src={partnerPhoto} alt="@shadcn" />
          <AvatarFallback>
            <UserIcon />
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1">
        <div className="font-bold">{partner?.member?.name || 'User'}</div>
        <div className="flex items-center gap-1 text-xs text-green-500">
          Online
        </div>
      </div>
    </div>
  );
}

function ChatListHeader() {
  const { auth } = usePageSharedDataProps();
  const photoUrl = auth?.user?.photo_url || DEFAULT_PHOTO;
  return (
    <div className="flex flex-0 items-center gap-2 border-b p-4">
      <div className="flex-0">
        <Avatar>
          <AvatarImage src={photoUrl} alt="@shadcn" />
          <AvatarFallback>
            <UserIcon />
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1">
        <div className="font-bold">Chats</div>
        <div className="flex items-center gap-1 text-xs text-green-500">
          Online
        </div>
      </div>
    </div>
  );
}

function ChatHeader() {
  const { roomId } = useFloatingChatWidgetContext();
  const room = useChatRoom(roomId);
  if (room?.type === 'private') return <PrivateChatHeader />;
  if (room?.type === 'group') return <GroupChatHeader />;
  return <ChatListHeader />;
}

export default function FloatingChatWidget() {
  const { open, setOpen, roomId } = useFloatingChatWidgetContext();
  const { company } = usePageSharedDataProps();

  const phone = company?.customer_service_phone || company?.phone;
  let whatsappUrl = '';
  if (phone) {
    const message = encodeURIComponent(`Halo, saya ingin bertanya tentang layanan Anda.`);
    whatsappUrl = `https://wa.me/${phone}?text=${message}`;
  }

  return (
    <>
      <div
        className={cn(
          'fixed right-4 lg:right-6 bottom-4 lg:bottom-6 flex flex-col gap-3 z-50',
          open && 'hidden',
        )}
      >
        {whatsappUrl && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                className="h-12 w-12 lg:h-16 lg:w-16 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-lg"
              >
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <IconBrandWhatsapp size={32} />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>WhatsApp</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setOpen(true)}
              className="h-12 w-12 lg:h-16 lg:w-16 rounded-full shadow-lg"
            >
              <MessageSquareIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Chat</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex min-h-screen flex-col gap-0">
          <ChatHeader />
          <div className="flex flex-1 flex-col">
            <div className="relative flex-1">
              {roomId ? (
                <ChatBox
                  roomId={roomId}
                  className="absolute top-0 left-0 h-full w-full"
                ></ChatBox>
              ) : (
                <ChatList className="absolute top-0 left-0 h-full w-full"></ChatList>
              )}
            </div>
            {!!roomId && <ChatInput roomId={roomId}></ChatInput>}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
