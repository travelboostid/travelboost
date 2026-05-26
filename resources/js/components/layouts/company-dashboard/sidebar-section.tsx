import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from '@/components/ui/sidebar';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import type { CompanyDashboardLayoutProps } from '.';
import { DashboardSidebarHeader } from '../components/dashboard-sidebar-header';
import { NavUser } from '../components/nav-user';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';

export function SidebarSection(props: CompanyDashboardLayoutProps) {
    const { company } = usePageSharedDataProps();
    return (
        <Sidebar
            variant="floating"
            collapsible="icon"
            className="p-1.5 group-data-[collapsible=icon]:p-2 [&_[data-slot=sidebar-inner]]:rounded-[1.75rem] [&_[data-slot=sidebar-inner]]:border [&_[data-slot=sidebar-inner]]:border-slate-200/80 [&_[data-slot=sidebar-inner]]:bg-white/95 [&_[data-slot=sidebar-inner]]:shadow-xl [&_[data-slot=sidebar-inner]]:shadow-slate-950/5 dark:[&_[data-slot=sidebar-inner]]:border-slate-800 dark:[&_[data-slot=sidebar-inner]]:bg-slate-950/95 dark:[&_[data-slot=sidebar-inner]]:shadow-black/20"
        >
            <SidebarHeader className="px-1.5 pt-4 pb-2 group-data-[collapsible=icon]:px-0">
                <DashboardSidebarHeader
                    activeId={`company:${company.username}`}
                />
            </SidebarHeader>
            <SidebarContent className="gap-1.5 px-1.5 pb-2 group-data-[collapsible=icon]:px-0">
                <NavMain {...props} />
                <NavSecondary />
            </SidebarContent>
            <SidebarFooter className="px-1.5 pt-2 pb-4 group-data-[collapsible=icon]:px-0">
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
