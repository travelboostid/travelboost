import { cn } from '@/lib/utils';
import { MessageSquareIcon } from 'lucide-react';
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
        @keyframes custom-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.05); }
        }
        .custom-pulse {
          animation: custom-pulse 1.8s infinite;
        }
      `}</style>

            <div
                ref={containerRef}
                className={cn(
                    'pointer-events-none fixed right-0 bottom-4 z-50 flex flex-col items-end gap-3',
                    open && 'hidden',
                )}
            >
                <div
                    className={cn(
                        'origin-bottom-right flex flex-col gap-2.5 transition-all duration-300 ease-out',
                        isExpanded
                            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                            : 'pointer-events-none translate-y-8 scale-75 opacity-0',
                    )}
                >
                    <StartWhatsappChatButton />
                    <StartLiveChatButton recipient={defaultLiveChatRecipient} />
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        'pointer-events-auto group z-50 flex h-16 w-14 items-center justify-center rounded-l-xl shadow-[0_0_25px_rgba(225,29,72,0.4)] transition-all duration-300',
                        isExpanded
                            ? 'bg-slate-800 text-white shadow-none'
                            : 'custom-pulse bg-linear-to-l from-primary to-rose-500 text-white hover:w-16',
                    )}
                >
                    <MessageSquareIcon
                        className={cn(
                            'transition-transform duration-300',
                            isExpanded
                                ? '-rotate-12 scale-110'
                                : 'group-hover:scale-110',
                        )}
                        size={24}
                    />
                </button>
            </div>
            <ChatSheet />
        </>
    );
}
