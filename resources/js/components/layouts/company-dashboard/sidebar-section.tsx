import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import type { CompanyDashboardLayoutProps } from '.';
import { NavUser } from '../components/nav-user';
import { TeamSwitcher } from '../components/team-switcher';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';

// This is sample data.

export function SidebarSection(props: CompanyDashboardLayoutProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher />
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
