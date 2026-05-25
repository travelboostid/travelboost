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
                    'pointer-events-none fixed right-3 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-5 sm:bottom-5',
                    open && 'hidden',
                )}
            >
                <div
                    className={cn(
                        'origin-bottom-right flex flex-col gap-2.5 rounded-[1.75rem] border border-white/70 bg-white/80 p-2 shadow-xl shadow-slate-950/10 backdrop-blur-xl transition-all duration-300 ease-out dark:border-slate-700/70 dark:bg-slate-950/80',
                        isExpanded
                            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                            : 'pointer-events-none translate-y-8 scale-90 opacity-0',
                    )}
                >
                    <StartWhatsappChatButton />
                    <StartLiveChatButton recipient={defaultLiveChatRecipient} />
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        'pointer-events-auto group relative z-50 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/70 text-white transition-all duration-300 sm:h-[3.75rem] sm:w-[3.75rem]',
                        isExpanded
                            ? 'bg-slate-950 shadow-lg shadow-slate-950/20 dark:bg-slate-800'
                            : 'floating-chat-glow bg-linear-to-br from-primary via-pink-500 to-rose-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-500/30',
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
