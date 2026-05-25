import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import type { AffiliateDashboardLayoutProps } from './index';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';

export function SidebarSection(props: AffiliateDashboardLayoutProps) {
    return (
        <Sidebar
            variant="floating"
            collapsible="icon"
            className="p-1.5 group-data-[collapsible=icon]:p-2 [&_[data-slot=sidebar-inner]]:rounded-[1.75rem] [&_[data-slot=sidebar-inner]]:border [&_[data-slot=sidebar-inner]]:border-slate-200/80 [&_[data-slot=sidebar-inner]]:bg-white/95 [&_[data-slot=sidebar-inner]]:shadow-xl [&_[data-slot=sidebar-inner]]:shadow-slate-950/5 dark:[&_[data-slot=sidebar-inner]]:border-slate-800 dark:[&_[data-slot=sidebar-inner]]:bg-slate-950/95 dark:[&_[data-slot=sidebar-inner]]:shadow-black/20"
            {...props}
        >
            <SidebarHeader className="px-1.5 pt-4 pb-2 group-data-[collapsible=icon]:px-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="h-14 rounded-2xl px-3 transition-all hover:bg-slate-50 hover:shadow-sm dark:hover:bg-slate-900"
                            asChild
                        >
                            <a
                                href="/affiliate/dashboard"
                                className="flex items-center justify-center group-data-[collapsible=icon]:px-0"
                            >
                                <img
                                    src="/images/logo/hori.png"
                                    alt="Travelboost Logo"
                                    className="block h-11 w-auto drop-shadow-sm dark:hidden group-data-[collapsible=icon]:hidden"
                                />

                                <img
                                    src="/images/logo/hori-wt.png"
                                    alt="Travelboost Logo"
                                    className="hidden h-11 w-auto drop-shadow-sm dark:block group-data-[collapsible=icon]:hidden"
                                />
                                <img
                                    src="/images/logo/logo-square/android-chrome-192x192.png"
                                    alt="Travelboost Logo"
                                    className="hidden size-8 rounded-xl group-data-[collapsible=icon]:block"
                                />
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-1.5 px-1.5 pb-4 group-data-[collapsible=icon]:px-0">
                <NavMain {...props} />
                <NavSecondary />
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
