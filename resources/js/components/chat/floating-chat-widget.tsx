import { cn } from '@/lib/utils';
import { MessageCircleIcon, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ChatSheet from './chat-sheet';
import StartLiveChatButton from './start-live-chat-button';
import StartWhatsappChatButton from './start-whatsapp-chat-button';
import type { Attachment, ChatActor } from './state';
import { useFloatingChatWidgetContext } from './state';

type FloatingChatWidgetProps = {
    defaultLiveChatRecipient?: {
        actor: ChatActor;
        attachment?: Attachment | null;
    } | null;
};

export default function FloatingChatWidget({
    defaultLiveChatRecipient,
}: FloatingChatWidgetProps) {
    const { open } = useFloatingChatWidgetContext();

    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsExpanded(false);
            }
        };

        if (isExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExpanded]);

    return (
        <>
            <style>{`
        @keyframes floating-chat-glow {
          0%, 100% { box-shadow: 0 18px 42px rgba(219, 39, 119, 0.24), 0 0 0 0 rgba(219, 39, 119, 0.18); }
          50% { box-shadow: 0 22px 54px rgba(219, 39, 119, 0.32), 0 0 0 10px rgba(219, 39, 119, 0); }
        }
        .floating-chat-glow {
          animation: floating-chat-glow 2.6s infinite;
        }
      `}</style>

            <div
                ref={containerRef}
                className={cn(
                    'pointer-events-none fixed right-0 bottom-8 z-50 flex items-end gap-2 sm:bottom-10',
                    open && 'hidden',
                )}
            >
                <div
                    className={cn(
                        'origin-right flex gap-2 rounded-l-2xl border border-r-0 border-white/70 bg-white/90 p-2 shadow-xl shadow-slate-950/10 backdrop-blur-xl transition-all duration-300 ease-out dark:border-slate-700/70 dark:bg-slate-950/90',
                        isExpanded
                            ? 'pointer-events-auto translate-x-0 scale-100 opacity-100'
                            : 'pointer-events-none translate-x-8 scale-95 opacity-0',
                    )}
                >
                    <StartWhatsappChatButton />
                    <StartLiveChatButton recipient={defaultLiveChatRecipient} />
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        'pointer-events-auto group relative z-50 flex h-16 w-12 items-center justify-center rounded-l-2xl border border-r-0 border-white/70 text-white transition-all duration-300 sm:h-[4.5rem]',
                        isExpanded
                            ? 'bg-slate-950 shadow-lg shadow-slate-950/20 dark:bg-slate-800'
                            : 'floating-chat-glow bg-linear-to-b from-primary via-pink-500 to-rose-500 hover:-translate-x-1 hover:shadow-2xl hover:shadow-pink-500/30',
                    )}
                    aria-label={
                        isExpanded ? 'Close chat options' : 'Open chat options'
                    }
                >
                    {isExpanded ? (
                        <XIcon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                    ) : (
                        <MessageCircleIcon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                    )}
                </button>
            </div>
            <ChatSheet />
        </>
    );
}
