import { Separator } from '@/components/ui/separator';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { type ReactNode } from 'react';
import type { BreadcrumbItemInfo } from '../components/breadcrumb-renderer';
import BreadcrumbRenderer from '../components/breadcrumb-renderer';
import { NavUser } from './nav-user';
import { SidebarSection } from './sidebar-section';

export type AffiliateDashboardLayoutProps = {
    children: ReactNode;
    breadcrumb?: BreadcrumbItemInfo[];
    applet?: ReactNode;
    containerClassName?: string;
    activeMenuIds?: string[];
    openMenuIds?: string[];
};

export default function AffiliateDashboardLayout(
    props: AffiliateDashboardLayoutProps,
) {
    const { children, breadcrumb, applet, containerClassName } = props;

    return (
        <SidebarProvider>
            <SidebarSection {...props} />
            <SidebarInset>
                <header className="flex h-16 w-full shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-background/50 backdrop-blur-md px-4 z-10 sticky top-0">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <div className="flex-1 hidden sm:block">
                            <BreadcrumbRenderer breadcrumb={breadcrumb} />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {applet}
                        <NavUser />
                    </div>
                </header>
                <main
                    className={`flex-1 p-4 md:p-6 ${containerClassName || ''}`}
                >
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
