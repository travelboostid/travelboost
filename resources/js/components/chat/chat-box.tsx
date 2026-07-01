import { type ChatMessageResource } from '@/api/model';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chat/chat-store';
import { Link } from '@inertiajs/react';
import { memo, useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '../ui/button';
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

type ChatMessageAction = {
    label: string;
    href: string;
};

type ChatMessageWithActions = ChatMessageResource & {
    actions?: ChatMessageAction[];
};

const ChatMessage = memo(function ChatMessage({
    message,
}: {
    message: ChatMessageWithActions;
}) {
    const actor = useChatActor();
    const mine =
        !message.is_bot &&
        message.sender_type === actor?.type &&
        message.sender_id === actor?.id;
    const isStreamingBot = message.is_bot && message.is_streaming;

    const bubbleContent = (
        <>
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
        </>
    );

    return (
        <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            {isStreamingBot ? (
                <div className="relative max-w-11/12 overflow-hidden rounded-2xl rounded-bl-sm p-[1.5px]">
                    <div
                        className="pointer-events-none absolute inset-[-150%] animate-spin bg-[conic-gradient(from_0deg,transparent_0deg,color-mix(in_oklch,var(--primary)_20%,transparent)_285deg,var(--primary)_330deg,color-mix(in_oklch,var(--primary)_35%,transparent)_25deg,transparent_75deg)] motion-reduce:animate-none animation-duration-[2.8s] [animation-timing-function:linear]"
                        aria-hidden="true"
                    />
                    <div className="relative flex flex-col gap-2 rounded-[calc(1rem-1.5px)] rounded-bl-[calc(0.125rem-1.5px)] bg-card px-4 py-3 text-foreground">
                        {bubbleContent}
                    </div>
                </div>
            ) : (
                <div
                    className={`flex max-w-11/12 flex-col gap-2 rounded-2xl px-4 py-3 ${
                        mine
                            ? 'rounded-br-sm bg-primary text-primary-foreground'
                            : 'rounded-bl-sm border border-border bg-card text-foreground'
                    }`}
                >
                    {bubbleContent}
                </div>
            )}
        </div>
    );
});

export function MessageContentRenderer({
    message,
}: {
    message: ChatMessageWithActions;
}) {
    if (message.is_streaming && !message.message) {
        return (
            <span className="inline-flex items-center gap-1 py-1">
                <span className="size-1.5 animate-pulse rounded-full bg-current opacity-60" />
                <span className="size-1.5 animate-pulse rounded-full bg-current opacity-60 [animation-delay:150ms]" />
                <span className="size-1.5 animate-pulse rounded-full bg-current opacity-60 [animation-delay:300ms]" />
            </span>
        );
    }

    const markdown = message.message || '';

    if (!message.is_bot) {
        return <p className="whitespace-pre-wrap break-words">{markdown}</p>;
    }

    return (
        <>
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
                        <td className="px-4 py-2 whitespace-nowrap">
                            {children}
                        </td>
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
                {markdown}
            </ReactMarkdown>
            {!message.is_streaming && (message.actions?.length ?? 0) > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {message.actions?.map((action) => (
                        <Button
                            key={`${action.href}-${action.label}`}
                            asChild
                            size="sm"
                            variant="secondary"
                            className="rounded-lg"
                        >
                            <Link href={action.href}>{action.label}</Link>
                        </Button>
                    ))}
                </div>
            )}
        </>
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
    const lastMessage = messages?.[messages.length - 1];
    const lastMessageId = lastMessage?.id;
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
            scrollToBottom(
                lastMessage?.is_streaming
                    ? 'auto'
                    : hasLoaded
                      ? 'smooth'
                      : 'auto',
            );
        }
    }, [
        hasLoaded,
        lastMessage?.is_streaming,
        lastMessage?.message?.length,
        lastMessageId,
        scrollToBottom,
    ]);

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
