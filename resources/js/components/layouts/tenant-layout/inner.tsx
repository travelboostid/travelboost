import { useAnonymousUserContext } from '@/components/anonymous-user-context-provider';
import FloatingChatWidget from '@/components/chat/floating-chat-widget';
import type { ChatActor } from '@/components/chat/state';
import {
  ChatContextProvider,
  FloatingChatWidgetContextProvider,
} from '@/components/chat/state';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { useMemo } from 'react';
import type { TenantLayoutProps } from '.';
import { Footer } from './footer';
import { Header } from './header';

export default function Inner({ children }: TenantLayoutProps) {
  const { auth } = usePageSharedDataProps();
  const anonymousUser = useAnonymousUserContext();
  const actor = useMemo<ChatActor>(() => {
    if (auth?.user) {
      return { type: 'user', id: auth.user.id };
    }
    return { type: 'anonymous-user', id: anonymousUser.id || 0 };
  }, [auth, anonymousUser]);

  return (
    <ChatContextProvider actor={actor}>
      <FloatingChatWidgetContextProvider>
        <div className="bg-background text-foreground transition-colors duration-300">
          <div className="min-h-screen ">
            <Header />
            <main>{children}</main>
          </div>
          <Footer />
        </div>
        <FloatingChatWidget />
      </FloatingChatWidgetContextProvider>
    </ChatContextProvider>
  );
}
