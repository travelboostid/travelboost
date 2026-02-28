import FloatingChatWidget from '@/components/chat/floating-chat-widget';
import {
  ChatContextProvider,
  FloatingChatWidgetContextProvider,
} from '@/components/chat/state';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { type ReactNode } from 'react';
import type { BreadcrumbItemInfo } from '../components/breadcrumb-renderer';
import BreadcrumbRenderer from '../components/breadcrumb-renderer';
import { SidebarSection } from './sidebar-section';

export type UserDashboardLayoutProps = {
  children: ReactNode;
  breadcrumb?: BreadcrumbItemInfo[];
  applet?: ReactNode;
  containerClassName?: string;
  activeMenuIds?: string[];
  openMenuIds?: string[];
};

export default function UserDashboardLayout(props: UserDashboardLayoutProps) {
  const { auth } = usePageSharedDataProps();
  const { children, breadcrumb, applet, containerClassName } = props;

  return (
    <ChatContextProvider actor={{ type: 'user', id: auth.user.id }}>
      <FloatingChatWidgetContextProvider
        initialValue={{ actor: { type: 'user', id: auth.user.id } }}
      >
        <SidebarProvider>
          <SidebarSection {...props} />
          <SidebarInset>
            <header className="flex h-16 w-full shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex w-full items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <div className="flex-1">
                  <BreadcrumbRenderer breadcrumb={breadcrumb} />
                </div>
                <div>{applet}</div>
              </div>
            </header>
            <div className={containerClassName}>{children}</div>
          </SidebarInset>
          <FloatingChatWidget />
        </SidebarProvider>
      </FloatingChatWidgetContextProvider>
    </ChatContextProvider>
  );
}
