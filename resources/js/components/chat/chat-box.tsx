import { type ChatMessageResource } from '@/api/model';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chat/chat-store';
import { useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    ChatEmptyConversation,
    ChatErrorPanel,
    ChatLoadMoreIndicator,
    ChatMessagesSkeleton,
} from './chat-status';
import RenderAttachment from './render-attachment';
import {
    useChatActor,
    useClearRoomError,
    useLoadMessages,
    useLoadRoom,
    useRoomMessages,
    useRoomPagination,
} from './state';

function ChatMessage({ message }: { message: ChatMessageResource }) {
    const actor = useChatActor();
    const mine =
        message.sender_type === actor?.type && message.sender_id === actor?.id;

    return (
        <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`flex max-w-11/12 flex-col gap-2 rounded-2xl px-4 py-3 ${
                    mine
                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                        : 'rounded-bl-sm border border-border bg-card text-foreground'
                }`}
            >
                <div className="text-sm leading-relaxed space-y-1.5">
                    <MessageContentRenderer message={message} />
                </div>
                {message.attachment_data && !message.is_bot && (
                    <div className="space-y-2 rounded-lg border bg-background/10 p-2">
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
                    <div className="w-full overflow-x-auto border">
                        <table className="w-full min-w-75 border-collapse text-sm">
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
    const clearRoomError = useClearRoomError();
    const messages = useRoomMessages(roomId);
    const { nextCursor, isLoading, error, hasLoaded } =
        useRoomPagination(roomId);
    const resetRoomPagination = useChatStore(
        (state) => state.resetRoomPagination,
    );
    const lastMessageId = messages?.[messages.length - 1]?.id;
    const isInitialLoading = isLoading && !hasLoaded;
    const isLoadingOlder = isLoading && hasLoaded;

    const scrollToBottom = useCallback(
        (behavior: ScrollBehavior = 'smooth') => {
            scrollAnchorRef.current?.scrollIntoView({ behavior });
        },
        [],
    );

    const { ref, inView } = useInView({
        threshold: 0,
    });

    const fetchMessages = useCallback(async () => {
        if (!inView || isLoading || nextCursor === '' || error) {
            return;
        }

        try {
            await loadRoom(roomId);
            await loadMessages(roomId, {
                cursor: nextCursor,
            });
        } catch {
            // Error state is stored in the chat store.
        }
    }, [error, inView, isLoading, loadMessages, loadRoom, nextCursor, roomId]);

    useEffect(() => {
        resetRoomPagination(roomId);
    }, [roomId, resetRoomPagination]);

    useEffect(() => {
        void fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        if (lastMessageId) {
            scrollToBottom(hasLoaded ? 'smooth' : 'auto');
        }
    }, [hasLoaded, lastMessageId, scrollToBottom]);

    const handleRetry = () => {
        clearRoomError(roomId);
    };

    if (isInitialLoading) {
        return <ChatMessagesSkeleton className={className} />;
    }

    if (error && !hasLoaded) {
        return (
            <ChatErrorPanel
                title="Could not load messages"
                message={error}
                onRetry={handleRetry}
                className={className}
            />
        );
    }

    return (
        <div
            className={cn(
                'mx-auto w-full overflow-y-auto px-4 py-6 sm:px-6',
                className,
            )}
        >
            <div ref={ref} />
            {isLoadingOlder && <ChatLoadMoreIndicator />}
            {error && hasLoaded && (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    <div>{error}</div>
                    <button
                        type="button"
                        className="mt-1 font-medium underline underline-offset-2"
                        onClick={handleRetry}
                    >
                        Try again
                    </button>
                </div>
            )}
            {hasLoaded && messages.length === 0 ? (
                <ChatEmptyConversation />
            ) : (
                <div className="flex flex-col gap-4">
                    {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                    ))}
                </div>
            )}
            <div ref={scrollAnchorRef} />
        </div>
    );
}
