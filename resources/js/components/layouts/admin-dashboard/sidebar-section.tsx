import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import type { AdminDashboardLayoutProps } from '.';
import { DashboardSidebarHeader } from '../components/dashboard-sidebar-header';
import { NavUser } from '../components/nav-user';
import { NavMain } from './nav-main';

// This is sample data.

export function SidebarSection(props: AdminDashboardLayoutProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <DashboardSidebarHeader activeId="admin:default" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain {...props} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
