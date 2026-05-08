import { Sheet, SheetContent } from '@/components/ui/sheet';
import { DEFAULT_PHOTO } from '@/config';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import { IconBrandWhatsapp, IconUsersGroup } from '@tabler/icons-react';
import { ChevronLeftIcon, MessageSquareIcon, UserIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
import {
  useChatContext,
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
  const { actor } = useChatContext();
  const { setAttachment, roomId, setRoomId } = useFloatingChatWidgetContext();
  const room = useChatRoom(roomId);

  const partner = room?.members?.find(
    (member) =>
      member?.member_type !== actor?.type || member?.member_id !== actor?.id,
  ) as any;

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

  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const phone = company?.customer_service_phone || company?.phone;
  let whatsappUrl = '';
  if (phone) {
    const message = encodeURIComponent(
      `Halo, saya ingin bertanya tentang layanan Anda.`,
    );
    whatsappUrl = `https://wa.me/${phone}?text=${message}`;
  }

  return (
    <>
      <style>{`
        @keyframes custom-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.05); }
        }
        .custom-pulse {
          animation: custom-pulse 1.8s infinite;
        }
      `}</style>

      <div
        ref={containerRef}
        className={cn(
          'fixed right-0 bottom-4 z-50 flex flex-col items-end gap-3', // PERUBAHAN: right-0 dan items-end
          open && 'hidden',
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-2.5 transition-all duration-300 ease-out origin-bottom-right', // PERUBAHAN: origin-bottom-right
            isExpanded
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-75 opacity-0 translate-y-8 pointer-events-none',
          )}
        >
          {whatsappUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  className="h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform mr-1"
                >
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconBrandWhatsapp size={28} />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>WhatsApp</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  setOpen(true);
                  setIsExpanded(false);
                }}
                className="h-14 w-14 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:scale-110 transition-transform bg-primary mr-1"
              >
                <MessageSquareIcon size={24} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Live Chat</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'group h-16 w-14 rounded-l-xl flex items-center justify-center transition-all duration-300 z-50 shadow-[0_0_25px_rgba(225,29,72,0.4)]', // PERUBAHAN: rounded-l-xl
            isExpanded
              ? 'bg-slate-800 text-white shadow-none'
              : 'bg-gradient-to-l from-primary to-rose-500 text-white hover:w-16 custom-pulse', // PERUBAHAN: bg-gradient-to-l
          )}
        >
          <MessageSquareIcon
            className={cn(
              'transition-transform duration-300',
              isExpanded ? '-rotate-12 scale-110' : 'group-hover:scale-110',
            )}
            size={24}
          />
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex min-h-screen flex-col gap-0 w-full sm:max-w-[480px]">
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
            {!!roomId && (
              <ChatInput roomId={roomId} className="flex-none border-t" />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
