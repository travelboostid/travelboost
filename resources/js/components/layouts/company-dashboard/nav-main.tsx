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
    <SidebarGroup>
      <SidebarGroupLabel>
        {company.type === 'vendor' ? 'Vendor Menu' : 'Agent Menu'}
      </SidebarGroupLabel>
      <SidebarMenuRenderer
        menu={menus}
        activeMenuIds={activeMenuIds || []}
        openMenuIds={openMenuIds || []}
      />
    </SidebarGroup>
  );
}
