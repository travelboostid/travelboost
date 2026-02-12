import FloatingChatWidget from '@/components/chat/floating-chat-widget';
import {
  ChatContextProvider,
  FloatingChatWidgetContextProvider,
} from '@/components/chat/state';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Fragment, useMemo, type ReactNode } from 'react';
import { AppSidebar } from './app-sidebar';

export type BreadcrumbItemInfo = {
  title: string;
  url?: string;
};

export type DashboardLayoutProps = {
  children: ReactNode;
  breadcrumb?: BreadcrumbItemInfo[];
  applet?: ReactNode;
  containerClassName?: string;
  activeMenuIds?: string[];
  openMenuIds?: string[];
};

export default function DashboardLayout(props: DashboardLayoutProps) {
  const { children, breadcrumb, applet, containerClassName } = props;
  const renderedBreadcrumb = useMemo(() => {
    if (!breadcrumb) return null;
    return (
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumb.map((b, index) => {
            // Add separator before all items except the first one
            const shouldAddSeparator = index > 0;

            return (
              <Fragment key={index}>
                {shouldAddSeparator && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
                <BreadcrumbItem className="hidden md:block">
                  {b.url ? (
                    <BreadcrumbLink href={b.url}>
                      {b.title || '-'}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{b.title || '-'}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }, [breadcrumb]);
  return (
    <ChatContextProvider>
      <FloatingChatWidgetContextProvider>
        <SidebarProvider>
          <AppSidebar {...props} />
          <SidebarInset>
            <header className="flex h-16 w-full shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex w-full items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <div className="flex-1">{renderedBreadcrumb}</div>
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
