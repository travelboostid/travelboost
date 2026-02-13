import {
  BuildingIcon,
  ChevronRight,
  HomeIcon,
  PlaneIcon,
  SettingsIcon,
  WalletIcon,
  type LucideIcon,
} from 'lucide-react';

import { useGetUsers } from '@/api/user/user';
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
import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import type { HTMLAttributeAnchorTarget } from 'react';
import { useMemo } from 'react';
import type { DashboardLayoutProps } from '.';

type MenuItem = {
  id: string;
  title: string;
  urlOrAction: string | (() => void);
  target?: HTMLAttributeAnchorTarget;
  icon?: LucideIcon;
  items?: MenuItem[];
};

export function NavMain({ activeMenuIds, openMenuIds }: DashboardLayoutProps) {
  const { auth } = usePage<SharedData>().props;
  const { data: dataVendor } = useGetUsers({ role: 'vendor' });
  const vendors = dataVendor?.data || [];
  const openState = useMemo<Record<string, boolean>>(
    () => (openMenuIds || []).reduce((a, c) => ({ ...a, [c]: true }), {}),
    [openMenuIds],
  );
  const activeState = useMemo<Record<string, boolean>>(
    () => (activeMenuIds || []).reduce((a, c) => ({ ...a, [c]: true }), {}),
    [activeMenuIds],
  );

  const menus = useMemo(() => {
    return [
      {
        id: 'home',
        title: 'Home',
        urlOrAction: '/dashboard',
        icon: HomeIcon,
      },
      auth.user.type === 'agent' && {
        id: 'vendor-tour-catalogs',
        title: 'Vendor Catalogs',
        urlOrAction: '#',
        icon: BuildingIcon,
        items: vendors.map((vendor) => ({
          id: `vendor-tour-catalogs.${vendor.username}`,
          title: vendor.name,
          urlOrAction: `/dashboard/vendors/${vendor.username}/tours`,
        })),
      },
      {
        id: 'tours',
        title: 'Tours',
        urlOrAction: '#',
        icon: PlaneIcon,
        items: [
          {
            id: 'tours.index',
            title: 'Tours',
            urlOrAction: '/dashboard/tours',
          },
          {
            id: 'tours.categories',
            title: 'Categories',
            urlOrAction: '/dashboard/categories',
          },
          {
            id: 'tours.catalogs',
            title: 'Tour Catalog',
            urlOrAction: `/${auth.user.username}`,
            target: '_blank',
          },
        ],
      },
      {
        id: 'funds',
        title: 'Funds',
        urlOrAction: '/dashboard/funds/wallets',
        icon: WalletIcon,
        items: [
          {
            id: 'funds.wallets',
            title: 'Wallet',
            urlOrAction: '/dashboard/funds/wallets',
          },
          {
            id: 'funds.wallet-transactions',
            title: 'Wallet Transactions',
            urlOrAction: '/dashboard/funds/wallet-transactions',
          },
          {
            id: 'funds.bank-accounts',
            title: 'Bank Accounts',
            urlOrAction: '/dashboard/funds/bank-accounts',
          },
          {
            id: 'funds.withdrawalss',
            title: 'Withdrawals',
            urlOrAction: '/dashboard/funds/withdrawals',
          },
          {
            id: 'funds.payments',
            title: 'Payment History',
            urlOrAction: '/dashboard/funds/payments',
          },
        ],
      },
      {
        id: 'settings',
        title: 'Settings',
        urlOrAction: '#',
        icon: SettingsIcon,
        items: [
          {
            id: 'settings.profile',
            title: 'Profile',
            urlOrAction: '/dashboard/settings/profile',
          },
          {
            id: 'settings.change-password',
            title: 'Change Password',
            urlOrAction: '/dashboard/settings/change-password',
          },
          {
            id: 'settings.preferences',
            title: 'Preferences',
            urlOrAction: '/dashboard/settings/preferences',
          },
        ],
      },
    ].filter(Boolean) as MenuItem[];
  }, [auth, vendors]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        {auth.user.type === 'vendor' ? 'Vendor Menu' : 'Agent Menu'}
      </SidebarGroupLabel>
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
