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

        try {
            setLoading(true);
            await startPrivateChat(recipient.actor, recipient.attachment);
        } catch {
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
                    className="h-[3.25rem] w-[3.25rem] rounded-2xl border border-white/70 bg-white text-slate-900 shadow-sm shadow-slate-950/10 transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                >
                    <MessageSquareIcon className="h-5 w-5" />
                </Button>
            </TooltipTrigger>

            <TooltipContent side="left">
                <p>Ask AI</p>
            </TooltipContent>
        </Tooltip>
    );
}
