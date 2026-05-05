import { useGetCompanies } from '@/api/company/company';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import type { LucideIcon } from 'lucide-react';
import {
  BoltIcon,
  BookUserIcon,
  FolderSearchIcon,
  HomeIcon,
  PlaneIcon,
  SettingsIcon,
  UsersRoundIcon,
  WalletIcon,
} from 'lucide-react';
import type { HTMLAttributeAnchorTarget } from 'react';
import React from 'react';
import { FormattedMessage } from 'react-intl';

type MenuItemBase = {
  id: string;
  title: string | React.ReactNode;
  urlOrAction: string | (() => void);
  target?: HTMLAttributeAnchorTarget;
  icon?: LucideIcon;
  visibleToPermissions?: string[];
  visibleToCompanyTypes?: string[];
  disabled?: boolean;
};

type MenuItem =
  | (MenuItemBase & {
      items?: MenuItem[];
      actions?: never;
    })
  | (MenuItemBase & {
      items?: never;
      actions?: MenuItem[];
    })
  | (MenuItemBase & {
      items?: never;
      actions?: never;
    });

export function useCompanyDashboardNavMainMenu() {
  const { company, auth, subscription_rules } = usePageSharedDataProps() as any;

  const { data } = useGetCompanies(
    { type: 'vendor' },
    { query: { enabled: company.type === 'agent' } },
  );

  let baseHost = window.location.hostname;
  if (baseHost === '127.0.0.1') {
    baseHost = 'localhost';
  }

  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';

  const companySubdomain = `${protocol}//${company.username}.${baseHost}${port}`;
  const isMarketingDisabled = !!subscription_rules?.isMarketingDisabled;

  const renderTitle = (node: React.ReactNode, isLocked: boolean) => {
    if (isLocked) {
      return (
        <span className="pointer-events-none block w-full cursor-not-allowed select-none opacity-50">
          {node}
        </span>
      );
    }
    return node;
  };

  const handleLockedClick = (e: any) => {
    e?.preventDefault();
    e?.stopPropagation();
  };

  const unfilteredMenus = [
    {
      id: 'home',
      title: <FormattedMessage defaultMessage="Dashboard" />,
      urlOrAction: `/companies/${company.username}/dashboard`,
      icon: HomeIcon,
      visibleToCompanyTypes: ['vendor', 'agent'],
    },
    {
      id: 'vendor-tours',
      title: <FormattedMessage defaultMessage="Vendor Catalogs" />,
      urlOrAction: '#',
      icon: FolderSearchIcon,
      items:
        (data?.data || []).map((vendor: any) => ({
          id: `vendor-tours.${vendor.username}`,
          title: vendor.name,
          urlOrAction: `/companies/${company.username}/dashboard/vendors/${vendor.username}/tours`,
        })) || [],
      visibleToCompanyTypes: ['agent'],
      visibleToPermissions: ['tour.query'],
    },
    {
      id: 'agent-registrations',
      title: <FormattedMessage defaultMessage="Agents" />,
      urlOrAction: `/companies/${company.username}/dashboard/agent-registrations`,
      icon: UsersRoundIcon,
      visibleToCompanyTypes: ['vendor'],
    },
    {
      id: 'tours',
      title: <FormattedMessage defaultMessage="Tours" />,
      urlOrAction: '#',
      icon: PlaneIcon,
      items: [
        {
          id: 'tours.index',
          title: <FormattedMessage defaultMessage="Products" />,
          urlOrAction: `/companies/${company.username}/dashboard/tours`,
        },
        {
          id: 'tours.preview',
          title: <FormattedMessage defaultMessage="My Catalogs" />,
          urlOrAction: `/companies/${company.username}/dashboard/vendors/${company.username}/tours`,
        },
        {
          id: 'tours.orders',
          title: <FormattedMessage defaultMessage="Bookings" />,
          urlOrAction: `/companies/${company.username}/dashboard/bookings`,
        },
        {
          id: 'tours.categories',
          title: <FormattedMessage defaultMessage="Product Categories" />,
          urlOrAction: `/companies/${company.username}/dashboard/categories`,
        },
        {
          id: 'tours.price-categories',
          title: <FormattedMessage defaultMessage="Price Categories" />,
          urlOrAction: `/companies/${company.username}/dashboard/price-categories`,
        },
      ],
      visibleToCompanyTypes: ['vendor'],
      visibleToPermissions: ['tour.query'],
    },
    {
      id: 'tours',
      title: <FormattedMessage defaultMessage="Tours" />,
      urlOrAction: '#',
      icon: PlaneIcon,
      items: [
        {
          id: 'agent-tours.index',
          title: <FormattedMessage defaultMessage="Products" />,
          urlOrAction: `/companies/${company.username}/dashboard/agent-tours`,
        },
        {
          id: 'tours.cats',
          title: <FormattedMessage defaultMessage="My Catalogs" />,
          urlOrAction: `/companies/${company.username}/dashboard/vendors/${company.username}/tours`,
        },
        {
          id: 'tours.bookings',
          title: <FormattedMessage defaultMessage="Bookings" />,
          urlOrAction: `/companies/${company.username}/dashboard/bookings`,
        },
        {
          id: 'tours.categories',
          title: <FormattedMessage defaultMessage="Product Categories" />,
          urlOrAction: `/companies/${company.username}/dashboard/categories`,
        },
      ],
      visibleToCompanyTypes: ['agent'],
      visibleToPermissions: ['tour.query'],
    },
    {
      id: 'customers',
      title: <FormattedMessage defaultMessage="Customers" />,
      urlOrAction: `/companies/${company.username}/dashboard/customers`,
      icon: BookUserIcon,
      visibleToCompanyTypes: ['agent'],
      visibleToPermissions: ['user.query'],
    },
    {
      id: 'funds',
      title: <FormattedMessage defaultMessage="Funds" />,
      urlOrAction: `/companies/${company.username}/dashboard/wallets`,
      icon: WalletIcon,
      items: [
        {
          id: 'funds.wallets',
          title: <FormattedMessage defaultMessage="Wallet" />,
          urlOrAction: `/companies/${company.username}/dashboard/wallets`,
        },
        {
          id: 'funds.wallet-transactions',
          title: <FormattedMessage defaultMessage="Wallet Transactions" />,
          urlOrAction: `/companies/${company.username}/dashboard/wallet-transactions`,
        },
        {
          id: 'funds.bank-accounts',
          title: <FormattedMessage defaultMessage="Bank Accounts" />,
          urlOrAction: `/companies/${company.username}/dashboard/bank-accounts`,
        },
        {
          id: 'funds.withdrawals',
          title: <FormattedMessage defaultMessage="Withdrawals" />,
          urlOrAction: `/companies/${company.username}/dashboard/withdrawals`,
        },
        {
          id: 'funds.payments',
          title: <FormattedMessage defaultMessage="Payment History" />,
          urlOrAction: `/companies/${company.username}/dashboard/payments`,
        },
      ],
      visibleToCompanyTypes: ['agent', 'vendor'],
      visibleToPermissions: ['fund.query'],
    },
    {
      id: 'marketings',
      title: <FormattedMessage defaultMessage="Marketings & Socmeds" />,
      urlOrAction: '#',
      icon: BoltIcon,
      items: [
        {
          id: 'marketings.landing-page.edit',
          title: renderTitle(
            <FormattedMessage defaultMessage="Edit Landing Page" />,
            isMarketingDisabled,
          ),
          urlOrAction: isMarketingDisabled
            ? (handleLockedClick as any)
            : `/companies/${company.username}/dashboard/page/edit`,
          disabled: isMarketingDisabled,
        },
        {
          id: 'marketings.landing-page.view',
          title: renderTitle(
            <FormattedMessage defaultMessage="My Landing Page" />,
            isMarketingDisabled,
          ),
          urlOrAction: isMarketingDisabled
            ? (handleLockedClick as any)
            : companySubdomain,
          target: isMarketingDisabled ? undefined : '_blank',
          disabled: isMarketingDisabled,
        },
        {
          id: 'marketings.socmed-analytics',
          title: renderTitle(
            <FormattedMessage defaultMessage="Social Media Analytics" />,
            isMarketingDisabled,
          ),
          urlOrAction: isMarketingDisabled ? (handleLockedClick as any) : '#',
          disabled: isMarketingDisabled,
        },
        {
          id: 'marketings.budgeting',
          title: renderTitle(
            <FormattedMessage defaultMessage="Promotion Budgetting" />,
            isMarketingDisabled,
          ),
          urlOrAction: isMarketingDisabled ? (handleLockedClick as any) : '#',
          disabled: isMarketingDisabled,
        },
      ],
      visibleToCompanyTypes: ['agent'],
    },
    {
      id: 'reports',
      title: <FormattedMessage defaultMessage="Reports" />,
      urlOrAction: '#',
      icon: BoltIcon,
      items: [
        {
          id: 'reports.room-listings',
          title: <FormattedMessage defaultMessage="Room Listings" />,
          urlOrAction: '#',
        },
        {
          id: 'reports.inventories',
          title: <FormattedMessage defaultMessage="Seat Availability" />,
          urlOrAction: '#',
        },
      ],
    },
    {
      id: 'settings',
      title: <FormattedMessage defaultMessage="Settings" />,
      urlOrAction: '#',
      icon: SettingsIcon,
      items: [
        {
          id: 'settings.profile',
          title: <FormattedMessage defaultMessage="Profile" />,
          urlOrAction: `/companies/${company.username}/dashboard/profile`,
        },
        {
          id: 'settings.parameter-vendor',
          title: <FormattedMessage defaultMessage="Parameters" />,
          urlOrAction: `/companies/${company.username}/dashboard/parameter-vendor`,
          visibleToCompanyTypes: ['vendor'],
        },
        {
          id: 'settings.teams',
          title: <FormattedMessage defaultMessage="User Management" />,
          urlOrAction: `/companies/${company.username}/dashboard/teams`,
        },
        {
          id: 'settings.roles',
          title: <FormattedMessage defaultMessage="Access Roles" />,
          urlOrAction: `/companies/${company.username}/dashboard/roles`,
        },
        {
          id: 'settings.chatbot',
          title: <FormattedMessage defaultMessage="Chat AI" />,
          urlOrAction: `/companies/${company.username}/dashboard/chatbot`,
        },
        {
          id: 'settings.vendor-registrations',
          title: <FormattedMessage defaultMessage="Registration to Vendor" />,
          urlOrAction: `/companies/${company.username}/dashboard/vendor-registrations`,
          visibleToCompanyTypes: ['agent'],
        },
        {
          id: 'settings.agent-subscriptions',
          title: 'Agent Subscriptions',
          urlOrAction: `/companies/${company.username}/dashboard/agent-subscriptions`,
          visibleToCompanyTypes: ['agent'],
        },
      ],
      visibleToCompanyTypes: ['agent', 'vendor'],
      visibleToPermissions: ['company.query'],
    },
  ] as MenuItem[];

  const isMenuVisible = (menu: MenuItem): boolean => {
    if (menu.visibleToCompanyTypes) {
      if (!menu.visibleToCompanyTypes.includes(company.type)) {
        return false;
      }
    }
    if (menu.visibleToPermissions) {
      const hasPermission = menu.visibleToPermissions.some((permission) =>
        auth.permissions.includes(permission),
      );
      if (!hasPermission) {
        return false;
      }
    }
    return true;
  };

  const filterMenuItems = (menus: MenuItem[]): MenuItem[] => {
    return menus.filter(isMenuVisible).map((menu) => {
      if (menu.items) {
        return { ...menu, items: filterMenuItems(menu.items) };
      }
      return menu;
    });
  };

  return filterMenuItems(unfilteredMenus);
}
