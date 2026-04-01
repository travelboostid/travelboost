import { type ChatMessageResource } from '@/api/model';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import ReactMarkdown from 'react-markdown';
import RenderAttachment from './render-attachment';
import {
  useFloatingChatWidgetContext,
  useLoadMessages,
  useLoadRoom,
  useRoomMessages,
} from './state';

/**
 * Renders a single chat message with styling based on sender type.
 * Displays message content with markdown support and optional attachments.
 */
function ChatMessage({ message }: { message: ChatMessageResource }) {
  const { actor } = useFloatingChatWidgetContext();
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
        {message.attachment_data && !message.is_bot && (
          <div className="rounded-lg border bg-background/10 p-2 space-y-2">
            <div className="text-xs opacity-80">Attached</div>
            <div className="text-sm">
              <RenderAttachment
                type={message.attachment_type || ''}
                data={message.attachment_data}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Renders the message content as markdown.
 */
export function MessageContentRenderer({
  message,
}: {
  message: ChatMessageResource;
}) {
  return <ReactMarkdown>{message?.message || ''}</ReactMarkdown>;
}

/**
 * Chat message container with infinite scroll pagination support.
 * Automatically loads older messages when the top of the conversation is visible.
 * Scrolls to the latest message whenever new messages are loaded.
 */
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

  /**
   * Scrolls the conversation to the bottom using smooth behavior.
   */
  const scrollToBottom = () => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Intersection observer to detect when the top of the message list is visible
  const { ref, inView } = useInView({
    /* Optional options */
    threshold: 0,
  });

  /**
   * Loads the chat room and fetches messages when the top becomes visible.
   * Pagination is handled via cursor-based loading for better performance.
   */
  useEffect(() => {
    if (!inView || nextCursor === '') return;
    loadRoom(roomId);
    loadMessages(roomId, {
      cursor: nextCursor,
    }).then((result) => {
      setNextCursor(result?.meta?.next_cursor || '');
    });
  }, [loadMessages, loadRoom, roomId, inView, nextCursor]);

  /**
   * Automatically scrolls to the latest message when the messages list updates.
   */
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
