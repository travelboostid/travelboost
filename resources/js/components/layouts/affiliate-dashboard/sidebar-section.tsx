import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
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
                            <a
                                href="/affiliate/dashboard"
                                className="flex items-center"
                            >
                                <img
                                    src="/images/logo/hori.png"
                                    alt="Travelboost Logo"
                                    className="h-11 w-auto block dark:hidden drop-shadow-sm"
                                />

                                <img
                                    src="/images/logo/hori-wt.png"
                                    alt="Travelboost Logo"
                                    className="h-11 w-auto hidden dark:block drop-shadow-sm"
                                />
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
