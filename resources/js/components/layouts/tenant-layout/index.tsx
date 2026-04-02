import AnonymousUserContextProvider from '@/components/anonymous-user-context-provider';
import type { ReactNode } from 'react';
import Inner from './inner';

export type TenantLayoutProps = {
  children: ReactNode;
};

export default function TenantLayout({ children }: TenantLayoutProps) {
  const { auth } = usePageSharedDataProps();
  const actorId = auth?.user?.id || 0;
  return (
    <ChatContextProvider actor={{ type: 'user', id: actorId }}>
      <FloatingChatWidgetContextProvider
        initialValue={{ actor: { type: 'user', id: actorId } }}
      >
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
