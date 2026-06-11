import type { StoreChatMessageRequest } from '@/api/model';
import { cn } from '@/lib/utils';
import { formatChatError } from '@/stores/chat/chat-error';
import { Send, XIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';
import RenderAttachment from './render-attachment';
import {
    useChatActor,
    useFloatingChatWidgetContext,
    useRoomSending,
    useSendMessage,
} from './state';

export default function ChatInput({
    roomId,
    className,
}: {
    roomId: number;
    className?: string;
}) {
    const sendMessage = useSendMessage();
    const actor = useChatActor();
    const { message, setMessage, attachment, setAttachment } =
        useFloatingChatWidgetContext();
    const sending = useRoomSending(roomId);
    const [sendError, setSendError] = useState<string | null>(null);

    const canSend =
        Boolean(actor?.id) &&
        !sending &&
        (message.trim().length > 0 || Boolean(attachment));

    const buildMessagePayload = (): StoreChatMessageRequest => {
        const data: StoreChatMessageRequest = {
            message: message.trim(),
            sender_type: actor?.type || '',
            sender_id: actor?.id || 0,
        };

        if (!attachment) {
            return data;
        }

        data.attachment_type = attachment.type;
        data.attachment_data = attachment.data;

        return data;
    };

    const handleSendMessage = async () => {
        if (!canSend) {
            return;
        }

        setSendError(null);

        try {
            await sendMessage(roomId, buildMessagePayload());
            setAttachment(null);
            setMessage('');
        } catch (error) {
            const errorMessage = formatChatError(error);
            setSendError(errorMessage);
            toast.error(errorMessage);
        }
    };

    return (
        <div
            className={cn(
                'flex min-h-16 flex-col divide-y bg-background',
                className,
            )}
        >
            {attachment && (
                <div className="flex items-start gap-3 p-4">
                    <div className="min-w-0 flex-1">
                        <RenderAttachment
                            type={attachment.type}
                            data={attachment.data}
                        />
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        disabled={sending}
                        onClick={() => setAttachment(null)}
                        aria-label="Remove attachment"
                    >
                        <XIcon className="size-4" />
                    </Button>
                </div>
            )}
            {sendError && (
                <div className="px-4 py-2 text-xs text-destructive">
                    {sendError}
                </div>
            )}
            <div className="flex gap-2 p-4">
                <Input
                    disabled={sending || !actor?.id}
                    type="text"
                    value={message}
                    onChange={(e) => {
                        setMessage(e.target.value);
                        if (sendError) {
                            setSendError(null);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            void handleSendMessage();
                        }
                    }}
                    placeholder={
                        actor?.id
                            ? 'Write your message...'
                            : 'Chat is initializing...'
                    }
                    className="flex-1"
                />
                <Button
                    disabled={!canSend}
                    onClick={() => void handleSendMessage()}
                    className="flex-none"
                >
                    {sending ? <Spinner /> : <Send className="size-4" />}
                    <span className="hidden sm:inline">
                        {sending ? 'Sending' : 'Send'}
                    </span>
                </Button>
            </div>
        </div>
    );
}
