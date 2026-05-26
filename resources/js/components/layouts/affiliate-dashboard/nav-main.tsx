import { SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { SidebarMenuRenderer } from '../components/sidebar-menu-renderer';
import type { AffiliateDashboardLayoutProps } from './index';
import { useAffiliateDashboardNavMainMenu } from './use-affiliate-dashboard-nav-main-menu';

export function NavMain({
    activeMenuIds,
    openMenuIds,
}: AffiliateDashboardLayoutProps) {
    const menus = useAffiliateDashboardNavMainMenu();

    return (
        <SidebarGroup className="gap-1.5 px-2">
            <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Main Menu
            </SidebarGroupLabel>
            <SidebarMenuRenderer
                menu={menus}
                activeMenuIds={activeMenuIds || []}
                openMenuIds={openMenuIds || []}
            />
        </SidebarGroup>
    );
}
