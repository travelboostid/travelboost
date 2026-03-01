'use client';

import { ChevronsUpDown, User2Icon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { DEFAULT_PHOTO } from '@/config';
import { Link } from '@inertiajs/react';
import { useAvailableDashboards } from './hooks';

export function TeamSwitcher({ activeId }: { activeId: string }) {
  const { isMobile } = useSidebar();
  const dashboards = useAvailableDashboards();
  const groupedDashboards = dashboards.reduce(
    (acc, dashboard) => {
      const [type] = dashboard.id.split(':');
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(dashboard);
      return acc;
    },
    {} as Record<string, typeof dashboards>,
  );
  const activeDashboard =
    dashboards.find((d) => d.id === activeId) || dashboards[0];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={activeDashboard.thumbnailUrl || DEFAULT_PHOTO}
                    alt={activeDashboard.title}
                  />
                  <AvatarFallback>
                    <User2Icon />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeDashboard.title}
                </span>
                <span className="truncate text-xs">
                  {activeDashboard.subtitle}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            {Object.keys(groupedDashboards).map((type) => {
              const dashboards = groupedDashboards[type];
              return (
                <>
                  <DropdownMenuLabel className="text-muted-foreground text-xs">
                    {type.charAt(0).toUpperCase() + type.slice(1)} Dashboard
                  </DropdownMenuLabel>
                  {dashboards.map((dashboard) => (
                    <DropdownMenuItem
                      key={dashboard.id}
                      asChild
                      className="gap-2 p-2"
                    >
                      <Link href={dashboard.baseUrl}>
                        <div className="flex size-6 items-center justify-center rounded-md border">
                          <Avatar className="size-6 rounded-lg">
                            <AvatarImage
                              src={dashboard.thumbnailUrl || DEFAULT_PHOTO}
                              alt={dashboard.title}
                            />
                            <AvatarFallback>
                              <User2Icon />
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        {dashboard.title}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
