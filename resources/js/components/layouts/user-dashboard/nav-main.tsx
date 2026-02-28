import { ChevronRight } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useMemo } from 'react';
import type { UserDashboardLayoutProps } from '.';
import useUserDashboardNavMainMenu from './use-user-dashboard-nav-main-menu';

export function NavMain({
  activeMenuIds,
  openMenuIds,
}: UserDashboardLayoutProps) {
  const openState = useMemo<Record<string, boolean>>(
    () => (openMenuIds || []).reduce((a, c) => ({ ...a, [c]: true }), {}),
    [openMenuIds],
  );
  const activeState = useMemo<Record<string, boolean>>(
    () => (activeMenuIds || []).reduce((a, c) => ({ ...a, [c]: true }), {}),
    [activeMenuIds],
  );

  const menus = useUserDashboardNavMainMenu();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>User Menu</SidebarGroupLabel>
      <SidebarMenu>
        {menus.map((menu) => {
          if (menu.items?.length) {
            return (
              <Collapsible
                key={menu.title}
                asChild
                defaultOpen={openState[menu.id]}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={menu.title}
                      isActive={activeState[menu.id]}
                    >
                      {menu.icon && <menu.icon />}
                      <span>{menu.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {menu.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          {typeof subItem.urlOrAction === 'string' ? (
                            <SidebarMenuSubButton
                              asChild
                              isActive={activeState[subItem.id]}
                            >
                              <a
                                href={subItem.urlOrAction}
                                target={subItem.target}
                              >
                                <span>{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          ) : (
                            <SidebarMenuSubButton
                              asChild
                              isActive={activeState[subItem.id]}
                              onClick={subItem.urlOrAction}
                            >
                              <span>
                                <span>{subItem.title}</span>
                              </span>
                            </SidebarMenuSubButton>
                          )}
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          } else {
            return typeof menu.urlOrAction === 'string' ? (
              <SidebarMenuButton asChild isActive={activeState[menu.id]}>
                <a href={menu.urlOrAction} target={menu.target}>
                  {menu.icon && <menu.icon />}
                  <span>{menu.title}</span>
                </a>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                asChild
                isActive={activeState[menu.id]}
                onClick={menu.urlOrAction}
              >
                {menu.icon && <menu.icon />}
                <span>{menu.title}</span>
              </SidebarMenuButton>
            );
          }
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
