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
    useSidebar,
} from '@/components/ui/sidebar';

import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import React, { useMemo, type HTMLAttributeAnchorTarget } from 'react';

export type MenuItemBase = {
    id: string;
    title: string | React.ReactNode;
    urlOrAction: string | (() => void);
    target?: HTMLAttributeAnchorTarget;
    icon?: LucideIcon;
    disabled?: boolean;
    badgeCount?: number;
};

export type MenuItem =
    | (MenuItemBase & { items?: MenuItem[]; actions?: never })
    | (MenuItemBase & { items?: never; actions?: MenuItem[] })
    | (MenuItemBase & { items?: never; actions?: never });

type Props = {
    menu: MenuItem[];
    activeMenuIds: string[];
    openMenuIds: string[];
    onNavigateAway?: (href: string) => void;
};

export function SidebarMenuRenderer({
    menu,
    activeMenuIds = [],
    openMenuIds = [],
    onNavigateAway,
}: Props) {
    const isMobile = useIsMobile();
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed' && !isMobile;
    const openState = useMemo<Record<string, boolean>>(
        () => (openMenuIds || []).reduce((a, c) => ({ ...a, [c]: true }), {}),
        [openMenuIds],
    );
    const activeState = useMemo<Record<string, boolean>>(
        () => (activeMenuIds || []).reduce((a, c) => ({ ...a, [c]: true }), {}),
        [activeMenuIds],
    );
    const visibleMenu = useMemo(() => {
        return menu.filter(
            (item) => item.items === undefined || item.items.length > 0,
        );
    }, [menu]);
    const isItemActive = (item: MenuItem): boolean =>
        Boolean(
            activeState[item.id] ||
            item.items?.some((child) => isItemActive(child)),
        );
    const renderBadge = (count?: number) => {
        if (!count || count <= 0) {
            return null;
        }

        return (
            <span className="ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-1.5 text-[0.68rem] font-semibold leading-none text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                {count > 99 ? '99+' : count}
            </span>
        );
    };
    const menuButtonClassName =
        'h-9 rounded-2xl px-2 text-[0.9rem] font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-950 hover:shadow-sm data-[active=true]:bg-primary/10 data-[active=true]:font-semibold data-[active=true]:text-primary data-[active=true]:shadow-sm data-[active=true]:shadow-primary/10 data-[active=true]:[&>svg]:text-primary dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white dark:data-[active=true]:bg-primary/20 dark:data-[active=true]:text-primary [&>svg]:size-[1.12rem] group-data-[collapsible=icon]:[&>svg]:size-5';
    const submenuButtonClassName =
        'h-8.5 rounded-xl pl-3 text-[0.85rem] font-medium shadow-none data-[active=true]:shadow-sm';
    const disabledButtonClassName =
        'h-9 rounded-2xl px-2 text-[0.9rem] font-medium text-slate-600 transition-all dark:text-slate-300';
    const handleLinkClick = (
        event: React.MouseEvent<HTMLAnchorElement>,
        href: string,
        target?: HTMLAttributeAnchorTarget,
    ) => {
        if (
            !onNavigateAway ||
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            (target && target !== '_self')
        ) {
            return;
        }

        event.preventDefault();
        onNavigateAway(href);
    };

    const renderLink = (item: MenuItem, isSub = false) => {
        const Button = isSub ? SidebarMenuSubButton : SidebarMenuButton;

        if (item.disabled) {
            return (
                <Button
                    isActive={false}
                    className={cn(
                        disabledButtonClassName,
                        isSub && submenuButtonClassName,
                    )}
                    tooltip={
                        typeof item.title === 'string' ? item.title : undefined
                    }
                >
                    <div className="flex w-full items-center gap-2 opacity-50 cursor-not-allowed pointer-events-none">
                        {item.icon && <item.icon />}
                        <span className="flex-1">{item.title}</span>
                        {renderBadge(item.badgeCount)}
                    </div>
                </Button>
            );
        }

        if (typeof item.urlOrAction === 'string') {
            return (
                <Button
                    asChild
                    isActive={isItemActive(item)}
                    className={cn(
                        menuButtonClassName,
                        isSub && submenuButtonClassName,
                    )}
                >
                    <a
                        href={item.urlOrAction}
                        target={item.target}
                        onClick={(event) =>
                            handleLinkClick(
                                event,
                                item.urlOrAction as string,
                                item.target,
                            )
                        }
                    >
                        {item.icon && (
                            <item.icon className="text-slate-500 transition-colors dark:text-slate-400" />
                        )}
                        <span className="flex-1">{item.title}</span>
                        {renderBadge(item.badgeCount)}

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
                isActive={isItemActive(item)}
                className={cn(
                    menuButtonClassName,
                    isSub && submenuButtonClassName,
                )}
            >
                <button
                    onClick={item.urlOrAction}
                    className="w-full flex items-center text-left"
                >
                    {item.icon && <item.icon className="text-slate-500" />}
                    <span className="flex-1">{item.title}</span>
                    {renderBadge(item.badgeCount)}
                </button>
            </Button>
        );
    };

    const renderCollapsedSubmenu = (item: MenuItem) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                    isActive={isItemActive(item)}
                    className={menuButtonClassName}
                >
                    {item.icon && (
                        <item.icon className="text-slate-500 dark:text-slate-400" />
                    )}
                    <span>{item.title}</span>
                    {renderBadge(item.badgeCount)}
                </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="min-w-56 rounded-2xl border-slate-200/80 p-1.5 shadow-xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-950"
                side="right"
                align="start"
                sideOffset={12}
            >
                {item.items?.map((sub) => (
                    <DropdownMenuItem
                        key={sub.id}
                        asChild={typeof sub.urlOrAction === 'string'}
                        disabled={sub.disabled}
                        onClick={
                            typeof sub.urlOrAction === 'function' &&
                            !sub.disabled
                                ? sub.urlOrAction
                                : undefined
                        }
                        className={cn(
                            'min-h-9 rounded-xl px-3 text-[0.88rem] font-medium text-slate-600 focus:bg-slate-100 focus:text-slate-950 dark:text-slate-300 dark:focus:bg-slate-900 dark:focus:text-white',
                            isItemActive(sub) &&
                                'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary',
                        )}
                    >
                        {typeof sub.urlOrAction === 'string' ? (
                            <a
                                className="flex w-full items-center gap-2"
                                href={
                                    sub.disabled ? undefined : sub.urlOrAction
                                }
                                target={sub.disabled ? undefined : sub.target}
                                onClick={(event) => {
                                    if (!sub.disabled) {
                                        handleLinkClick(
                                            event,
                                            sub.urlOrAction as string,
                                            sub.target,
                                        );
                                    }
                                }}
                            >
                                {sub.icon && (
                                    <sub.icon className="size-4 text-slate-500 dark:text-slate-400" />
                                )}
                                <span className="min-w-0 flex-1 truncate">
                                    {sub.title}
                                </span>
                                {renderBadge(sub.badgeCount)}
                                {sub.target === '_blank' && (
                                    <ExternalLinkIcon className="ml-auto size-3 text-muted-foreground" />
                                )}
                            </a>
                        ) : (
                            <div className="flex w-full items-center gap-2">
                                {sub.icon && (
                                    <sub.icon className="size-4 text-slate-500 dark:text-slate-400" />
                                )}
                                <span className="min-w-0 flex-1 truncate">
                                    {sub.title}
                                </span>
                                {renderBadge(sub.badgeCount)}
                            </div>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );

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
                    {actions.map((action, actionIndex) => (
                        <DropdownMenuItem
                            key={action.id || actionIndex}
                            asChild
                            onClick={
                                typeof action.urlOrAction === 'function' &&
                                !action.disabled
                                    ? action.urlOrAction
                                    : undefined
                            }
                            disabled={action.disabled}
                        >
                            <a
                                className={`flex items-center gap-2 w-full ${action.disabled ? 'pointer-events-none opacity-50' : ''}`}
                                href={
                                    typeof action.urlOrAction === 'string' &&
                                    !action.disabled
                                        ? action.urlOrAction
                                        : undefined
                                }
                                target={
                                    action.disabled ? undefined : action.target
                                }
                                onClick={(event) => {
                                    if (
                                        typeof action.urlOrAction ===
                                            'string' &&
                                        !action.disabled
                                    ) {
                                        handleLinkClick(
                                            event,
                                            action.urlOrAction,
                                            action.target,
                                        );
                                    }
                                }}
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
            {visibleMenu.map((item, index) => {
                if (item.items?.length) {
                    if (isCollapsed) {
                        return (
                            <SidebarMenuItem key={item.id || index}>
                                {renderCollapsedSubmenu(item)}
                            </SidebarMenuItem>
                        );
                    }

                    return (
                        <Collapsible
                            key={item.id || index}
                            asChild
                            open={isItemActive(item) ? true : undefined}
                            defaultOpen={
                                openState[item.id] || isItemActive(item)
                            }
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        tooltip={
                                            typeof item.title === 'string'
                                                ? item.title
                                                : undefined
                                        }
                                        isActive={activeState[item.id]}
                                        className={menuButtonClassName}
                                    >
                                        {item.icon && (
                                            <item.icon className="text-slate-500 dark:text-slate-400" />
                                        )}
                                        <span>{item.title}</span>
                                        {renderBadge(item.badgeCount)}

                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <SidebarMenuSub className="mr-0 mt-0.5 border-slate-200/80 pr-0 dark:border-slate-800">
                                        {item.items.map((sub, subIndex) => (
                                            <SidebarMenuSubItem
                                                key={sub.id || subIndex}
                                            >
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
                    <SidebarMenuItem key={item.id || index}>
                        {renderLink(item)} {renderActions(item.actions)}
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );
}
