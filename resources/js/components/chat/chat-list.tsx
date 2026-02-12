import type { ChatRoomResource } from '@/api/model';
import { DEFAULT_PHOTO } from '@/config';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { IconUsersGroup } from '@tabler/icons-react';
import { UserIcon } from 'lucide-react';
import { useEffect } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarGroupCount,
  AvatarImage,
} from '../ui/avatar';
import {
  useChatRooms,
  useFloatingChatWidgetContext,
  useLoadRooms,
} from './state';

function PrivateRoomItem({ room }: { room: ChatRoomResource }) {
  const { auth } = usePage<SharedData>().props;
  const { setRoomId } = useFloatingChatWidgetContext();
  const partner = room.members!.find(
    (member) => member?.user?.id !== auth.user.id,
  );
  const partnerPhoto = partner?.user?.photo_url || DEFAULT_PHOTO;
  return (
    <div className="flex gap-2 p-4" onClick={() => setRoomId(room.id)}>
      <div className="flex-none">
        <Avatar>
          <AvatarImage src={partnerPhoto} alt="@shadcn" />
          <AvatarFallback>
            <UserIcon />
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1">
        <div>{partner?.user?.name || 'User'}</div>
        <div className="text-xs text-muted-foreground">
          {room.last_message?.message || ''}
        </div>
      </div>
    </div>
  );
}

function GroupRoomItem({ room }: { room: ChatRoomResource }) {
  const { setRoomId } = useFloatingChatWidgetContext();
  return (
    <div className="flex gap-2 p-4" onClick={() => setRoomId(room.id)}>
      <div className="flex-none">
        <AvatarGroupCount>
          <IconUsersGroup />
        </AvatarGroupCount>
      </div>
      <div className="flex-1">
        <div>{room.name}</div>
        <div className="text-xs text-muted-foreground">
          {room.last_message?.message || ''}
        </div>
      </div>
    </div>
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
  const loadRooms = useLoadRooms();
  const rooms = useChatRooms();
  useEffect(() => {
    loadRooms({ per_page: 100 });
  }, []);

  return (
    <div className={cn('divide-y overflow-y-auto', className)}>
      {rooms.map((room) => (
        <RoomItem room={room} />
      ))}
    </div>
  );
}
