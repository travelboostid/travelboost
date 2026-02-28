import { type ChatMessageResource } from '@/api/model';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import ReactMarkdown from 'react-markdown';
import {
  useFloatingChatWidgetContext,
  useLoadMessages,
  useLoadRoom,
  useRoomMessages,
} from './state';

function ChatMessage({ message }: { message: ChatMessageResource }) {
  const { actor } = useFloatingChatWidgetContext();
  console.log('message', message, actor);
  const mine =
    message.sender_type === actor?.type && message.sender_id === actor?.id;
  return (
    <div
      key={message.id}
      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`flex max-w-3/4 flex-col gap-2 rounded-lg px-4 py-3 ${
          mine
            ? 'rounded-br-none bg-primary text-primary-foreground'
            : 'rounded-bl-none border border-border bg-card text-foreground'
        }`}
      >
        <p className="text-sm leading-relaxed">
          <MessageContentRenderer message={message} />
        </p>
        {message.attachment && (
          <div className="rounded-lg border bg-background/25 px-2 py-1 text-xs">
            Tour ID {message.attachment}
          </div>
        )}
      </div>
    </div>
  );
}

export function MessageContentRenderer({
  message,
}: {
  message: ChatMessageResource;
}) {
  return <ReactMarkdown>{message?.message || ''}</ReactMarkdown>;
}

export default function ChatBox({
  roomId,
  className,
}: {
  roomId: number;
  className?: string;
}) {
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const loadMessages = useLoadMessages();
  const loadRoom = useLoadRoom();
  const messages = useRoomMessages(roomId);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const scrollToBottom = () => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { ref, inView } = useInView({
    /* Optional options */
    threshold: 0,
  });

  useEffect(() => {
    if (!inView || nextCursor === '') return;
    loadRoom(roomId);
    loadMessages(roomId, {
      cursor: nextCursor,
    }).then((result) => {
      setNextCursor(result?.meta?.next_cursor || '');
    });
  }, [loadMessages, loadRoom, roomId, inView, nextCursor]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div
      className={cn(
        'mx-auto w-full overflow-y-auto px-4 py-8 sm:px-6 lg:px-8',
        className,
      )}
    >
      <div ref={ref}></div>
      <div className="gap-6 flex flex-col">
        {(messages || []).map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      <div ref={scrollAnchorRef} />
    </div>
  );
}
