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
            className="h-14 rounded-2xl px-2.5 transition-all hover:bg-slate-50 hover:shadow-sm data-[state=open]:bg-slate-50 data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-0! dark:hover:bg-slate-900 dark:data-[state=open]:bg-slate-900"
        >
            <div className="flex aspect-square size-10 items-center justify-center rounded-2xl bg-slate-50 text-sidebar-primary-foreground shadow-sm ring-1 ring-slate-200/80 group-data-[collapsible=icon]:size-9 dark:bg-slate-900 dark:ring-slate-800">
                <Avatar className="h-10 w-10 rounded-2xl group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9">
                    <AvatarImage
                        src={activeDashboard.thumbnailUrl || DEFAULT_PHOTO}
                        alt={activeDashboard.title}
                    />
                    <AvatarFallback className="rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        <User2Icon className="h-5 w-5" />
                    </AvatarFallback>
                </Avatar>
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold text-slate-950 dark:text-white">
                    {activeDashboard.title}
                </span>
                <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {activeDashboard.subtitle}
                </span>
            </div>
        </SidebarMenuButton>
    );
}
