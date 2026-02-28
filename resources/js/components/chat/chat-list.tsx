import type { ChatRoomResource } from '@/api/model';
import { DEFAULT_PHOTO } from '@/config';
import { cn } from '@/lib/utils';
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
  const { actor } = useFloatingChatWidgetContext();
  const { setRoomId } = useFloatingChatWidgetContext();
  const partner = room?.members?.find(
    (member) =>
      member?.member_type !== actor?.type || member?.member_id !== actor?.id,
  ) as any;
  const partnerPhoto = partner?.member?.photo_url || DEFAULT_PHOTO;
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
        <div>{partner?.member?.name || 'User'}</div>
        <div className="text-xs text-muted-foreground line-clamp-1">
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
        <div className="text-xs text-muted-foreground line-clamp-1">
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
  const { actor } = useFloatingChatWidgetContext();
  const loadRooms = useLoadRooms();
  const rooms = useChatRooms();
  useEffect(() => {
    loadRooms({
      per_page: 100,
      member_type: actor?.type || 'user',
      member_id: actor?.id || 0,
    });
  }, [actor, loadRooms]);

  return (
    <div className={cn('divide-y overflow-y-auto', className)}>
      {rooms.map((room) => (
        <RoomItem room={room} />
      ))}
    </div>
  );
}
