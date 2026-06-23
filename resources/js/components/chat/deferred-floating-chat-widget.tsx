import { activateChatStack } from '@/lib/activate-chat-stack';
import { MessageCircleIcon } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import type { Attachment, ChatActor } from './state';
import { useFloatingChatWidgetContext } from './state';

const FloatingChatWidget = lazy(() => import('./floating-chat-widget'));

type DeferredFloatingChatWidgetProps = {
    defaultLiveChatRecipient?: {
        actor: ChatActor;
        attachment?: Attachment | null;
    } | null;
};

export default function DeferredFloatingChatWidget(
    props: DeferredFloatingChatWidgetProps,
) {
    const { open } = useFloatingChatWidgetContext();
    const [deferredLoad, setDeferredLoad] = useState(false);
    const shouldLoad = open || deferredLoad;

    useEffect(() => {
        if (open) {
            activateChatStack();
        }
    }, [open]);

    const handleActivate = () => {
        activateChatStack();
        setDeferredLoad(true);
    };

    if (!shouldLoad) {
        return (
            <button
                type="button"
                onClick={handleActivate}
                className="pointer-events-auto fixed right-0 bottom-8 z-50 flex h-16 w-12 items-center justify-center rounded-l-2xl border border-r-0 border-white/70 bg-linear-to-b from-primary via-pink-500 to-rose-500 text-white shadow-xl sm:bottom-10 sm:h-[4.5rem]"
                aria-label="Open chat options"
            >
                <MessageCircleIcon className="h-6 w-6" />
            </button>
        );
    }

    return (
        <Suspense fallback={null}>
            <FloatingChatWidget {...props} />
        </Suspense>
    );
}
