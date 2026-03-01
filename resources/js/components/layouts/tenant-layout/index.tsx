import FloatingChatWidget from '@/components/chat/floating-chat-widget';
import {
  ChatContextProvider,
  FloatingChatWidgetContextProvider,
} from '@/components/chat/state';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import type { ReactNode } from 'react';
import { Footer } from './footer';
import { Header } from './header';
type TenantLayoutProps = {
  children: ReactNode;
};

export default function TenantLayout({ children }: TenantLayoutProps) {
  const { auth } = usePageSharedDataProps();
  return (
    <ChatContextProvider actor={{ type: 'user', id: auth.user.id }}>
      <FloatingChatWidgetContextProvider
        initialValue={{ actor: { type: 'user', id: auth.user.id } }}
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
