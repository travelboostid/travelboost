import {
    Alert,
    AlertAction,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
    IconAlertCircle,
    IconMessageCircle,
    IconMessageCircleExclamation,
} from '@tabler/icons-react';
import { RefreshCwIcon } from 'lucide-react';
import { Button } from '../ui/button';

export function ChatRoomListSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('divide-y', className)}>
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex gap-3 p-4">
                    <Skeleton className="size-10 shrink-0 rounded-full" />
                    <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-full max-w-48" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ChatMessagesSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('flex flex-col gap-6 px-4 py-8', className)}>
            <div className="flex justify-start">
                <Skeleton className="h-16 w-48 rounded-2xl rounded-bl-none" />
            </div>
            <div className="flex justify-end">
                <Skeleton className="h-12 w-56 rounded-2xl rounded-br-none" />
            </div>
            <div className="flex justify-start">
                <Skeleton className="h-20 w-64 rounded-2xl rounded-bl-none" />
            </div>
        </div>
    );
}

export function ChatHeaderSkeleton() {
    return (
        <div className="flex items-center gap-3 border-b p-4">
            <Skeleton className="size-5 shrink-0 rounded" />
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
    );
}

export function ChatErrorPanel({
    title = 'Could not load chat',
    message,
    onRetry,
    className,
}: {
    title?: string;
    message: string;
    onRetry?: () => void;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex h-full items-center justify-center p-6',
                className,
            )}
        >
            <Alert variant="destructive" className="max-w-sm">
                <IconAlertCircle />
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
                {onRetry && (
                    <AlertAction>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onRetry}
                            className="mt-2"
                        >
                            <RefreshCwIcon className="size-3.5" />
                            Try again
                        </Button>
                    </AlertAction>
                )}
            </Alert>
        </div>
    );
}

export function ChatEmptyRooms({ className }: { className?: string }) {
    return (
        <Empty className={cn('h-full border-none p-10', className)}>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <IconMessageCircleExclamation />
                </EmptyMedia>
                <EmptyTitle>No conversations yet</EmptyTitle>
                <EmptyDescription>
                    Start a chat from a tour or use the chat button to connect
                    with someone.
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}

export function ChatEmptyConversation({ className }: { className?: string }) {
    return (
        <Empty className={cn('border-none py-16', className)}>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <IconMessageCircle />
                </EmptyMedia>
                <EmptyTitle>Start the conversation</EmptyTitle>
                <EmptyDescription>
                    Send a message below. Your chat history will appear here.
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}

export function ChatLoadMoreIndicator() {
    return (
        <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
            <Spinner className="size-3.5" />
            Loading older messages...
        </div>
    );
}
