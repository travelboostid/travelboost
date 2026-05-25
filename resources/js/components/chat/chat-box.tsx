import { type ChatMessageResource } from '@/api/model';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RenderAttachment from './render-attachment';
import {
    useChatContext,
    useLoadMessages,
    useLoadRoom,
    useRoomMessages,
} from './state';

/**
 * Renders a single chat message with styling based on sender type.
 * Displays message content with markdown support and optional attachments.
 */
function ChatMessage({ message }: { message: ChatMessageResource }) {
    const { actor } = useChatContext();
    const mine =
        message.sender_type === actor?.type && message.sender_id === actor?.id;

    return (
        <div
            key={message.id}
            className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
        >
            <div
                className={`flex max-w-11/12 flex-col gap-2 rounded-lg px-4 py-3 ${
                    mine
                        ? 'rounded-br-none bg-primary text-primary-foreground'
                        : 'rounded-bl-none border border-border bg-card text-foreground'
                }`}
            >
                <p className="text-sm leading-relaxed space-y-1.5">
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
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                table: ({ children }) => (
                    <div className="border w-full overflow-x-auto">
                        <table className="w-full  min-w-75 text-sm border-collapse">
                            {children}
                        </table>
                    </div>
                ),
                thead: ({ children }) => (
                    <thead className="border-b">{children}</thead>
                ),
                th: ({ children }) => (
                    <th className="px-4 py-2 text-left font-medium whitespace-nowrap">
                        {children}
                    </th>
                ),
                td: ({ children }) => (
                    <td className="px-4 py-2 whitespace-nowrap">{children}</td>
                ),
                tr: ({ children }) => (
                    <tr className="border-b last:border-0 hover:bg-muted/50">
                        {children}
                    </tr>
                ),
                ul: ({ children }) => (
                    <ul className="mb-4 bt-2 ml-6 list-disc space-y-2">
                        {children}
                    </ul>
                ),
                ol: ({ children }) => (
                    <ol className="my-4 ml-6 list-decimal space-y-2">
                        {children}
                    </ol>
                ),
                li: ({ children }) => (
                    <li className="leading-normal">{children}</li>
                ),
            }}
        >
            {message?.message || ''}
        </ReactMarkdown>
    );
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
    const lastMessageId = messages?.[messages.length - 1]?.id;

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
    }, [lastMessageId]);

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
