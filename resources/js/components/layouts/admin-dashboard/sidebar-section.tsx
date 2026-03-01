import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import type { AdminDashboardLayoutProps } from '.';
import { NavUser } from '../components/nav-user';
import { TeamSwitcher } from '../components/team-switcher';
import { NavMain } from './nav-main';

// This is sample data.

export function SidebarSection(props: AdminDashboardLayoutProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher activeId="admin:default" />
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
