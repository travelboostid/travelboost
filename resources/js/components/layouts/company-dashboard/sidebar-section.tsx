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

// This is sample data.

export function SidebarSection(props: CompanyDashboardLayoutProps) {
  const { company } = usePageSharedDataProps();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <DashboardSidebarHeader activeId={`company:${company.username}`} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain {...props} />
        <NavSecondary />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
