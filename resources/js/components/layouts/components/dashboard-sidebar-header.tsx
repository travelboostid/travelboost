'use client';

import { User2Icon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { DEFAULT_PHOTO } from '@/config';
import { useAvailableDashboards } from './hooks';

export function DashboardSidebarHeader({ activeId }: { activeId: string }) {
  const dashboards = useAvailableDashboards();
  const activeDashboard =
    dashboards.find((d) => d.id === activeId) || dashboards[0];

  return (
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
        <span className="truncate font-medium">{activeDashboard.title}</span>
        <span className="truncate text-xs">{activeDashboard.subtitle}</span>
      </div>
    </SidebarMenuButton>
  );
}
