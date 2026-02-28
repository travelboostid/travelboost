import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { GalleryVerticalEnd } from 'lucide-react';
import type { AdminDashboardLayoutProps } from '.';
import { NavUser } from '../components/nav-user';
import { NavMain } from './nav-main';

// This is sample data.

export function SidebarSection(props: AdminDashboardLayoutProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <a className="flex gap-2 p-2" href="/">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-bold">TravelBoost.co.id</span>
            <span className="truncate text-xs">Platform Promosi Agent</span>
          </div>
        </a>
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
