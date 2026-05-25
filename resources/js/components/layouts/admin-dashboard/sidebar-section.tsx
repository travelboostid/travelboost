import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from '@/components/ui/sidebar';
import type { AdminDashboardLayoutProps } from '.';
import { DashboardSidebarHeader } from '../components/dashboard-sidebar-header';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';
import { NavUser } from './nav-user';

export function SidebarSection(props: AdminDashboardLayoutProps) {
    return (
        <Sidebar
            variant="floating"
            collapsible="icon"
            className="p-2 group-data-[collapsible=icon]:p-2 [&_[data-slot=sidebar-inner]]:rounded-[1.75rem] [&_[data-slot=sidebar-inner]]:border [&_[data-slot=sidebar-inner]]:border-slate-200/80 [&_[data-slot=sidebar-inner]]:bg-white/95 [&_[data-slot=sidebar-inner]]:shadow-xl [&_[data-slot=sidebar-inner]]:shadow-slate-950/5 dark:[&_[data-slot=sidebar-inner]]:border-slate-800 dark:[&_[data-slot=sidebar-inner]]:bg-slate-950/95 dark:[&_[data-slot=sidebar-inner]]:shadow-black/20"
        >
            <SidebarHeader className="px-2 pt-4 pb-2 group-data-[collapsible=icon]:px-0">
                <DashboardSidebarHeader activeId="admin:default" />
            </SidebarHeader>
            <SidebarContent className="gap-2 px-2 pb-2 group-data-[collapsible=icon]:px-0">
                <NavMain {...props} />
                <NavSecondary />
            </SidebarContent>
            <SidebarFooter className="px-2 pt-2 pb-4 group-data-[collapsible=icon]:px-0">
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
