import type { ChatActor } from '@/components/chat/state';
import { ChatContextProvider } from '@/components/chat/state';

import { FloatingChatWidgetContextProvider } from '@/components/chat/state';

import { useAnonymousUserContext } from '@/components/anonymous-user-context-provider';
import FloatingChatWidget from '@/components/chat/floating-chat-widget';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { useMemo } from 'react';
import type { PublicCatalogLayoutProps } from './PublicCatalogLayout';

export default function PublicCatalogLayoutInner({
  children,
}: PublicCatalogLayoutProps) {
  const { auth } = usePageSharedDataProps();
  const anonymousUser = useAnonymousUserContext();
  console.log('PublicCatalogLayoutInner render', {
    auth,
    anonymousUser,
  });
  const actor = useMemo<ChatActor>(() => {
    if (auth?.user) {
      return { type: 'user', id: auth.user.id };
    }
    return { type: 'anonymous-user', id: anonymousUser.id || 0 };
  }, [auth, anonymousUser]);
  console.log('actor', actor);
  return (
    <ChatContextProvider actor={actor}>
      <FloatingChatWidgetContextProvider>
        <div className="min-h-screen bg-background">
          {/* HEADER */}
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">TravelBoost</h1>
          </div>

          {/* CONTENT */}
          <main className="p-4">{children}</main>
        </div>

        <FloatingChatWidget />
      </FloatingChatWidgetContextProvider>
    </ChatContextProvider>
  );
}
