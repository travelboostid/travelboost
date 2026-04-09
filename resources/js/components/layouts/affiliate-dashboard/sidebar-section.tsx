import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { DashboardSidebarHeader } from '../components/dashboard-sidebar-header';
import { NavUser } from '../components/nav-user';
import type { AffiliateDashboardLayoutProps } from './index';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';

export function SidebarSection(props: AffiliateDashboardLayoutProps) {
  const { auth } = usePageSharedDataProps();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <DashboardSidebarHeader
          activeId={`affiliate:${auth?.user?.username}`}
        />
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
