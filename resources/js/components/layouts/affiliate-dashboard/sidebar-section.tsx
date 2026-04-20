import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Globe } from 'lucide-react';
import type { AffiliateDashboardLayoutProps } from './index';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';

export function SidebarSection(props: AffiliateDashboardLayoutProps) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/affiliate/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Globe className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-blue-600 dark:text-blue-500 text-lg">
                    TravelBoost
                  </span>
                  {/* <span className="truncate text-xs font-medium text-slate-500">
                    for Affiliator
                  </span> */}
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain {...props} />
        <NavSecondary />
      </SidebarContent>
    </Sidebar>
  );
}
