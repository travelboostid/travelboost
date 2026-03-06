import { SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import type { AdminDashboardLayoutProps } from '.';
import { SidebarMenuRenderer } from '../components/sidebar-menu-renderer';
import useAdminNavMainMenu from './use-admin-nav-main-menu';

export function NavMain({
  activeMenuIds,
  openMenuIds,
}: AdminDashboardLayoutProps) {
  const menus = useAdminNavMainMenu();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin Menu</SidebarGroupLabel>
      <SidebarMenuRenderer
        menu={menus}
        activeMenuIds={activeMenuIds || []}
        openMenuIds={openMenuIds || []}
      />
    </SidebarGroup>
  );
}
