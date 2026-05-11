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
  shouldDisplay?: (roles: string[], permissions: string[]) => boolean;
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
      shouldDisplay: (roles, _permissions) =>
        roles.includes('user:vendor') || roles.includes('user:agent'),
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
      shouldDisplay: (roles, permissions) =>
        roles.includes('user:agent') &&
        permissions.includes('tour.query') &&
        (data?.data || []).length > 0,
    },
    {
      id: 'agent-registrations',
      title: <FormattedMessage defaultMessage="Agents" />,
      urlOrAction: `/companies/${company.username}/dashboard/agent-registrations`,
      icon: UsersRoundIcon,
      shouldDisplay: (roles, _permissions) => roles.includes('user:vendor'),
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
          shouldDisplay: (_roles, permissions) =>
            permissions.includes('tour.query'),
        },
        {
          id: 'tours.preview',
          title: <FormattedMessage defaultMessage="My Catalogs" />,
          urlOrAction: `/companies/${company.username}/dashboard/vendors/${company.username}/tours`,
          shouldDisplay: (_roles, permissions) =>
            permissions.includes('tour.query'),
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
      shouldDisplay: (roles, permissions) =>
        roles.includes('user:vendor') && permissions.includes('tour.query'),
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
          shouldDisplay: (_roles, permissions) =>
            permissions.includes('tour.query'),
        },
        {
          id: 'tours.cats',
          title: <FormattedMessage defaultMessage="My Catalogs" />,
          urlOrAction: `/companies/${company.username}/dashboard/vendors/${company.username}/tours`,
          shouldDisplay: (_roles, permissions) =>
            permissions.includes('tour-category.query'),
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
      shouldDisplay: (roles, permissions) =>
        roles.includes('user:agent') && permissions.includes('tour.query'),
    },
    {
      id: 'customers',
      title: <FormattedMessage defaultMessage="Customers" />,
      urlOrAction: `/companies/${company.username}/dashboard/customers`,
      icon: BookUserIcon,
      shouldDisplay: (roles, permissions) =>
        roles.includes('user:agent') && permissions.includes('user.query'),
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
          shouldDisplay: (_roles, permissions) =>
            permissions.includes('wallet.query'),
        },
        {
          id: 'funds.wallet-transactions',
          title: <FormattedMessage defaultMessage="Wallet Transactions" />,
          urlOrAction: `/companies/${company.username}/dashboard/wallet-transactions`,
          shouldDisplay: (_roles, permissions) =>
            permissions.includes('wallet-transaction.query'),
        },
        {
          id: 'funds.bank-accounts',
          title: <FormattedMessage defaultMessage="Bank Accounts" />,
          urlOrAction: `/companies/${company.username}/dashboard/bank-accounts`,
          shouldDisplay: (_roles, permissions) =>
            permissions.includes('bank-account.query'),
        },
        {
          id: 'funds.withdrawals',
          title: <FormattedMessage defaultMessage="Withdrawals" />,
          urlOrAction: `/companies/${company.username}/dashboard/withdrawals`,
          shouldDisplay: (_roles, permissions) =>
            permissions.includes('withdrawal.query'),
        },
        {
          id: 'funds.payments',
          title: <FormattedMessage defaultMessage="Payment History" />,
          urlOrAction: `/companies/${company.username}/dashboard/payments`,
          shouldDisplay: (_roles, permissions) =>
            permissions.includes('payment.query'),
        },
      ],
      shouldDisplay: (roles, permissions) =>
        (roles.includes('user:agent') || roles.includes('user:vendor')) &&
        permissions.includes('wallet.query'),
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
      shouldDisplay: (roles, _permissions) => roles.includes('user:agent'),
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
          urlOrAction: `/companies/${company.username}/dashboard/reports/room-listings`,
          visibleToCompanyTypes: ['vendor'],
        },
        {
          id: 'reports.seat-availability',
          title: <FormattedMessage defaultMessage="Seat Availability" />,
          urlOrAction: `/companies/${company.username}/dashboard/reports/seat-availabilities`,
          visibleToCompanyTypes: ['vendor'],
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
          shouldDisplay: (roles, permissions) =>
            permissions.includes('company-settings.query'),
        },
        {
          id: 'settings.parameter-vendor',
          title: <FormattedMessage defaultMessage="Parameters" />,
          urlOrAction: `/companies/${company.username}/dashboard/parameter-vendor`,
          shouldDisplay: (roles, permissions) =>
            roles.includes('user:vendor') &&
            permissions.includes('company-settings.query'),
        },
        {
          id: 'settings.teams',
          title: <FormattedMessage defaultMessage="User Management" />,
          urlOrAction: `/companies/${company.username}/dashboard/teams`,
          shouldDisplay: (_roles, permissions) =>
            permissions.includes('company-team.query'),
        },
        {
          id: 'settings.roles',
          title: <FormattedMessage defaultMessage="Access Roles" />,
          urlOrAction: `/companies/${company.username}/dashboard/roles`,
          shouldDisplay: (_roles, permissions) =>
            permissions.includes('role.query'),
        },
        {
          id: 'settings.chatbot',
          title: <FormattedMessage defaultMessage="Chat AI" />,
          urlOrAction: `/companies/${company.username}/dashboard/chatbot`,
          shouldDisplay: (roles, permissions) =>
            permissions.includes('company-settings.query'),
        },
        {
          id: 'settings.vendor-registrations',
          title: <FormattedMessage defaultMessage="Registration to Vendor" />,
          urlOrAction: `/companies/${company.username}/dashboard/vendor-registrations`,
          shouldDisplay: (roles, permissions) =>
            roles.includes('user:agent') &&
            permissions.includes('company-settings.query'),
        },
        {
          id: 'settings.agent-subscriptions',
          title: 'Agent Subscriptions',
          urlOrAction: `/companies/${company.username}/dashboard/agent-subscriptions`,
          shouldDisplay: (roles, permissions) =>
            roles.includes('user:agent') &&
            permissions.includes('company-settings.query'),
        },
      ],
      shouldDisplay: (roles, _permissions) =>
        roles.includes('user:agent') || roles.includes('user:vendor'),
    },
  ] as MenuItem[];

  const isMenuVisible = (menu: MenuItem): boolean => {
    if (menu.shouldDisplay) {
      return menu.shouldDisplay(auth.roles, auth.permissions);
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
