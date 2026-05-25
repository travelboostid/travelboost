import { SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import type { CompanyDashboardLayoutProps } from '.';
import { SidebarMenuRenderer } from '../components/sidebar-menu-renderer';
import { useCompanyDashboardNavMainMenu } from './use-company-dashboard-nav-main-menu';

export function NavMain({
    activeMenuIds,
    openMenuIds,
}: CompanyDashboardLayoutProps) {
    const { company } = usePageSharedDataProps();
    const menus = useCompanyDashboardNavMainMenu();

    return (
        <SidebarGroup className="gap-1.5 px-2">
            <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {company.type === 'vendor' ? 'Vendor Menu' : 'Agent Menu'}
            </SidebarGroupLabel>
            <SidebarMenuRenderer
                menu={menus as any}
                activeMenuIds={activeMenuIds || []}
                openMenuIds={openMenuIds || []}
            />
        </SidebarGroup>
    );
}
