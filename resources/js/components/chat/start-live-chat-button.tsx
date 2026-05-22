import { MessageSquareIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import type { Attachment, ChatActor } from './state';
import { useFloatingChatWidgetContext } from './state';

type StartLiveChatButtonProps = {
    recipient?: { actor: ChatActor; attachment?: Attachment | null } | null;
};

export default function StartLiveChatButton({
    recipient,
}: StartLiveChatButtonProps) {
    const [loading, setLoading] = useState(false);
    const { setOpen, startPrivateChat } = useFloatingChatWidgetContext();

    const handleClick = async () => {
        if (!recipient) {
            setOpen(true);
            return;
        }

        // If actor is defined, start a private chat with the actor, passing the attachment if available
        try {
            setLoading(true);
            await startPrivateChat(recipient.actor, recipient.attachment);
        } catch (e) {
            toast.error('Failed to start chat. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    disabled={loading}
                    onClick={handleClick}
                    className="h-14 w-14 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:scale-110 transition-transform bg-primary mr-1"
                >
                    <MessageSquareIcon size={24} />
                </Button>
            </TooltipTrigger>

            <TooltipContent side="left">
                <p>Live Chat</p>
            </TooltipContent>
        </Tooltip>
    );
}
