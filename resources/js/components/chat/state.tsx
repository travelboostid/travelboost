import {
  createChatMessage,
  getChatMessages,
} from '@/api/chat-message/chat-message';
import {
  getChatRoom,
  getChatRooms,
  useOpenChatRoom,
} from '@/api/chat-room/chat-room';
import type {
  ChatMessageResource,
  ChatRoomResource,
  GetChatMessages200,
  GetChatMessagesParams,
  GetChatRoomsParams,
  StoreChatMessageRequest,
} from '@/api/model';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { useEcho } from '@laravel/echo-react';
import { MessageSquareIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import { toast } from 'sonner';

type ChatActor = {
  type: 'user' | 'company';
  id: number;
};

type ChatState = {
  actor: ChatActor | null;
  roomById: { [id: number]: ChatRoomResource };
  messageById: { [id: number]: ChatMessageResource };
};

type ChatActions = {
  sendMessage: (roomId: number, dto: StoreChatMessageRequest) => Promise<any>;
  loadMessages: (
    roomId: number,
    options: GetChatMessagesParams,
  ) => Promise<GetChatMessages200>;
  loadRoom: (roomId: number) => Promise<any>;
  loadRooms: (options: GetChatRoomsParams) => Promise<any>;
};

type ChatContextType = ChatState & ChatActions;

export const ChatContext = createContext<ChatContextType>(null!);

export function ChatContextProvider({
  children,
  actor,
}: {
  children: ReactNode;
  actor: ChatActor;
}) {
  const { auth } = usePageSharedDataProps();
  const [roomById, setRoomById] = useState<Record<number, ChatRoomResource>>(
    {},
  );
  const [messageById, setMessageById] = useState<
    Record<number, ChatMessageResource>
  >({});
  const sendMessage = async (roomId: number, dto: StoreChatMessageRequest) => {
    const result = await createChatMessage(roomId.toString(), dto);
    setMessageById((prev) => ({
      ...prev,
      [result.data.id]: result.data,
    }));
    return result.data;
  };
  const loadMessages = async (
    roomId: number,
    options: GetChatMessagesParams,
  ) => {
    const result = await getChatMessages(roomId.toString(), options);
    setMessageById((prev) => {
      const next = { ...prev };

      for (const message of result.data) {
        next[message.id] = message;
      }

      return next;
    });
    return result;
  };

  const loadRoom = async (roomId: number) => {
    const result = await getChatRoom(roomId);
    setRoomById((prev) => {
      const next = { ...prev, [roomId]: result.data };
      return next;
    });
    return result;
  };

  const loadRooms = async (options: GetChatMessagesParams) => {
    const result = await getChatRooms(options);
    setRoomById((prev) => {
      const next = { ...prev };

      for (const room of result.data) {
        next[room.id] = room;
      }

      return next;
    });
    return result;
  };

  // 🔔 Message created
  useEcho(`users.${auth.user.id}`, '.ChatMessageCreated', (e) => {
    setMessageById((prev) => ({
      ...prev,
      [e.id]: e,
    }));

    // Toast new message notification
    if (actor.type !== e.sender_type || actor.id !== e.sender_id) {
      toast(e.sender.name, {
        description: <p className="line-clamp-1">{e.message || '???'}</p>,
        icon: <MessageSquareIcon />,
        position: 'top-center',
      });
    }
  });

  // 🔔 Room updated
  useEcho(`users.${auth.user.id}`, '.ChatRoomUpdated', (e) => {
    setRoomById((prev) => ({
      ...prev,
      [e.room.id]: {
        ...prev[e.room.id],
        ...e.room,
      },
    }));
  });

  // 🔔 Room created
  useEcho(`users.${auth.user.id}`, '.ChatRoomCreated', (e) => {
    setRoomById((prev) => ({
      ...prev,
      [e.room.id]: e.room,
    }));
  });

  return (
    <ChatContext.Provider
      value={{
        actor,
        loadMessages,
        loadRoom,
        loadRooms,
        messageById,
        roomById,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  return useContext(ChatContext);
}

export function useLoadMessages() {
  const { loadMessages } = useChatContext();
  return loadMessages;
}

export function useLoadRoom() {
  const { loadRoom } = useChatContext();
  return loadRoom;
}

export function useLoadRooms() {
  const { loadRooms } = useChatContext();
  return loadRooms;
}

export function useSendMessage() {
  const { sendMessage } = useChatContext();
  return sendMessage;
}

export function useRoomMessages(roomId: number) {
  const { messageById } = useChatContext();
  return Object.values(messageById)
    .filter((message) => message.room_id == roomId)
    .sort((a, b) => {
      return (
        new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
      );
    });
}

export function useChatRooms() {
  const { roomById } = useChatContext();
  return Object.values(roomById).sort((a, b) => {
    return (
      new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime()
    );
  });
}

export function useChatRoom(roomId: number) {
  const { roomById } = useChatContext();
  return roomById[roomId];
}

export function useMessage(messageId: number) {
  const { messageById } = useChatContext();
  return messageById[messageId];
}

type Attachment = {
  type: 'tour' | 'agent-tour';
  data: any;
};

type FloatingChatWidgetContextType = {
  actor: ChatActor | null;
  setActor: (o: ChatActor | null) => void;
  message: string;
  setMessage: (o: string) => void;
  attachment: Attachment | undefined | null;
  setAttachment: (o: Attachment | undefined | null) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  roomId: number;
  setRoomId: (roomId: number) => void;
  startPrivateChat: (actor: ChatActor) => Promise<void>;
};

const FloatingChatWidgetContext = createContext<FloatingChatWidgetContextType>(
  null!,
);

export function FloatingChatWidgetContextProvider({
  children,
  initialValue,
}: {
  children: ReactNode;
  initialValue?: Partial<FloatingChatWidgetContextType>;
}) {
  const { auth } = usePageSharedDataProps();
  const [actor, setActor] = useState<ChatActor | null>(
    initialValue?.actor || null,
  );
  const openChatRoom = useOpenChatRoom();
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<Attachment | undefined | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [roomId, setRoomId] = useState(0);

  const startPrivateChat = async (recepient: ChatActor) => {
    const result = await openChatRoom.mutateAsync({
      data: {
        sender_id: actor?.id || auth.user.id,
        sender_type: actor?.type || 'user',
        recipient_id: recepient.id,
        recipient_type: recepient.type,
      },
    });
    setRoomId(result.data.id);
    setOpen(true);
  };

  return (
    <FloatingChatWidgetContext.Provider
      value={{
        actor,
        setActor,
        open,
        setOpen,
        roomId,
        setRoomId,
        message,
        setMessage,
        attachment,
        setAttachment,
        startPrivateChat,
      }}
    >
      {children}
    </FloatingChatWidgetContext.Provider>
  );
}

export function useFloatingChatWidgetContext() {
  return useContext(FloatingChatWidgetContext);
}
