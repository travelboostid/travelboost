import type { StoreChatMessageRequest } from '@/api/model';
import { cn } from '@/lib/utils';
import { formatChatError } from '@/stores/chat/chat-error';
import { Send, XIcon } from 'lucide-react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { Textarea } from '../ui/textarea';
import RenderAttachment from './render-attachment';
import {
    useChatActor,
    useChatDraft,
    useFloatingChatWidgetContext,
    useRoomSending,
    useSendMessage,
} from './state';

const MAX_INPUT_ROWS = 3;

export default function ChatInput({
    roomId,
    className,
}: {
    roomId: number;
    className?: string;
}) {
    const sendMessage = useSendMessage();
    const actor = useChatActor();
    const { message, setMessage } = useChatDraft();
    const { attachment, setAttachment } = useFloatingChatWidgetContext();
    const sending = useRoomSending(roomId);
    const [sendError, setSendError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const resizeTextarea = useCallback(() => {
        const textarea = textareaRef.current;

        if (!textarea) {
            return;
        }

        textarea.style.height = 'auto';

        const styles = window.getComputedStyle(textarea);
        const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
        const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
        const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
        const borderTop = Number.parseFloat(styles.borderTopWidth) || 0;
        const borderBottom = Number.parseFloat(styles.borderBottomWidth) || 0;
        const maxHeight =
            lineHeight * MAX_INPUT_ROWS +
            paddingTop +
            paddingBottom +
            borderTop +
            borderBottom;

        textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
        textarea.style.overflowY =
            textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }, []);

    useLayoutEffect(() => {
        resizeTextarea();
    }, [message, resizeTextarea]);

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
            <div className="flex items-end gap-2 p-4">
                <Textarea
                    ref={textareaRef}
                    rows={1}
                    disabled={sending || !actor?.id}
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
                    className="max-h-none min-h-9 flex-1 resize-none py-2 leading-5 [field-sizing:fixed]"
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
