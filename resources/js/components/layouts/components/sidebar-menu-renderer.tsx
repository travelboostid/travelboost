import type { LucideIcon } from 'lucide-react';
import {
  ChevronRight,
  ExternalLinkIcon,
  MoreHorizontalIcon,
} from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

import { useIsMobile } from '@/hooks/use-mobile';
import { useMemo, type HTMLAttributeAnchorTarget } from 'react';

export type MenuItemBase = {
  id: string;
  title: string;
  urlOrAction: string | (() => void);
  target?: HTMLAttributeAnchorTarget;
  icon?: LucideIcon;
};

export type MenuItem =
  | (MenuItemBase & { items?: MenuItem[]; actions?: never })
  | (MenuItemBase & { items?: never; actions?: MenuItem[] })
  | (MenuItemBase & { items?: never; actions?: never });

type Props = {
  menu: MenuItem[];
  activeMenuIds: string[];
  openMenuIds: string[];
};

export function SidebarMenuRenderer({
  menu,
  activeMenuIds = [],
  openMenuIds = [],
}: Props) {
  const isMobile = useIsMobile();
  const openState = useMemo<Record<string, boolean>>(
    () => (openMenuIds || []).reduce((a, c) => ({ ...a, [c]: true }), {}),
    [openMenuIds],
  );
  const activeState = useMemo<Record<string, boolean>>(
    () => (activeMenuIds || []).reduce((a, c) => ({ ...a, [c]: true }), {}),
    [activeMenuIds],
  );

  const renderLink = (item: MenuItem, isSub = false) => {
    const Button = isSub ? SidebarMenuSubButton : SidebarMenuButton;

    if (typeof item.urlOrAction === 'string') {
      return (
        <Button asChild isActive={activeState[item.id]}>
          <a href={item.urlOrAction} target={item.target}>
            {item.icon && <item.icon />}
            <span className="flex-1">{item.title}</span>

            {item.target === '_blank' && (
              <ExternalLinkIcon className="size-3 text-muted-foreground" />
            )}
          </a>
        </Button>
      );
    }

    return (
      <Button
        asChild
        isActive={activeState[item.id]}
        onClick={item.urlOrAction}
      >
        <span>
          {item.icon && <item.icon />}
          {item.title}
        </span>
      </Button>
    );
  };

  function renderActions(actions?: MenuItem[]) {
    if (!actions?.length) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover>
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-48 rounded-lg"
          side={isMobile ? 'bottom' : 'right'}
          align={isMobile ? 'end' : 'start'}
        >
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.id}
              asChild
              onClick={
                typeof action.urlOrAction === 'function'
                  ? action.urlOrAction
                  : undefined
              }
            >
              <a
                className="flex items-center gap-2 w-full"
                href={
                  typeof action.urlOrAction === 'string'
                    ? action.urlOrAction
                    : undefined
                }
                target={action.target}
              >
                {action.icon && (
                  <action.icon className="text-muted-foreground" />
                )}
                {action.title}
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <SidebarMenu>
      {menu.map((item) => {
        if (item.items?.length) {
          return (
            <Collapsible
              key={item.id}
              asChild
              defaultOpen={openState[item.id]}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={activeState[item.id]}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>

                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub className="pr-0 mr-0">
                    {item.items.map((sub) => (
                      <SidebarMenuSubItem key={sub.id}>
                        {renderLink(sub, true)}
                        {renderActions(sub.actions)}
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        }

        return (
          <SidebarMenuItem key={item.id}>
            {renderLink(item)} {renderActions(item.actions)}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
