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

type MenuItemBase = {
  id: string;
  title: string;
  urlOrAction: string | (() => void);
  target?: HTMLAttributeAnchorTarget;
  icon?: LucideIcon;
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
  const appHost = import.meta.env.VITE_APP_HOST;
  const { company } = usePageSharedDataProps();
  const { data } = useGetCompanies(
    { type: 'vendor' },
    { query: { enabled: company.type === 'agent' } },
  );

  return company.type === 'vendor'
    ? ([
        {
          id: 'home',
          title: 'Home',
          urlOrAction: `/companies/${company.username}/dashboard`,
          icon: HomeIcon,
        },
        {
          id: 'agent-registrations',
          title: 'Agents',
          urlOrAction: `/companies/${company.username}/dashboard/agent-registrations`,
          icon: UsersRoundIcon,
        },
        {
          id: 'tours',
          title: 'Tours',
          urlOrAction: '#',
          icon: PlaneIcon,
          items: [
            {
              id: 'tours.index',
              title: 'Products',
              urlOrAction: `/companies/${company.username}/dashboard/tours`,
            },
            {
              id: 'tours.categories',
              title: 'Product Categories',
              urlOrAction: `/companies/${company.username}/dashboard/categories`,
            },
            {
              id: 'tours.preview',
              title: 'My Catalogs',
              //urlOrAction: `//${company.username}.${appHost}/tours`,
              urlOrAction: `//${company.username}.${appHost}`,
              target: '_blank',
            },
            {
              id: 'tours.orders',
              title: 'Orders',
              urlOrAction: `/companies/${company.username}/dashboard/orders`,
            },
          ],
        },
        {
          id: 'customers',
          title: 'Customers',
          urlOrAction: `/companies/${company.username}/dashboard/customers`,
          icon: BookUserIcon,
        },
        {
          id: 'funds',
          title: 'Funds',
          urlOrAction: `/companies/${company.username}/dashboard/wallets`,
          icon: WalletIcon,
          items: [
            {
              id: 'funds.wallets',
              title: 'Wallet',
              urlOrAction: `/companies/${company.username}/dashboard/wallets`,
            },
            {
              id: 'funds.wallet-transactions',
              title: 'Wallet Transactions',
              urlOrAction: `/companies/${company.username}/dashboard/wallet-transactions`,
            },
            {
              id: 'funds.bank-accounts',
              title: 'Bank Accounts',
              urlOrAction: `/companies/${company.username}/dashboard/bank-accounts`,
            },
            {
              id: 'funds.withdrawals',
              title: 'Withdrawals',
              urlOrAction: `/companies/${company.username}/dashboard/withdrawals`,
            },
            {
              id: 'funds.payments',
              title: 'Payment History',
              urlOrAction: `/companies/${company.username}/dashboard/payments`,
            },
          ],
        },
        {
          id: 'reports',
          title: 'Reports',
          urlOrAction: '#',
          icon: BoltIcon,
          items: [
            {
              id: 'reports.room-listings',
              title: 'Room Listings',
              urlOrAction: `#`,
            },
            {
              id: 'reports.inventories',
              title: 'Inventory Status',
              urlOrAction: `#`,
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
              urlOrAction: `/companies/${company.username}/dashboard/profile`,
            },
            {
              id: 'settings.teams',
              title: 'User Management',
              urlOrAction: `/companies/${company.username}/dashboard/teams`,
            },
            {
              id: 'settings.roles',
              title: 'Access Roles',
              urlOrAction: `/companies/${company.username}/dashboard/roles`,
            },
            {
              id: 'settings.chatbot',
              title: 'Chat AI',
              urlOrAction: `/companies/${company.username}/dashboard/chatbot`,
            },
          ],
        },
      ] as MenuItem[])
    : ([
        {
          id: 'home',
          title: 'Dashboard',
          urlOrAction: `/companies/${company.username}/dashboard`,
          icon: HomeIcon,
        },
        {
          id: 'vendor-tours',
          title: 'Vendor Catalogs',
          urlOrAction: '#',
          icon: FolderSearchIcon,
          items:
            (data?.data || []).map((vendor) => ({
              id: `vendor-tours.${vendor.id}`,
              title: vendor.name,
              urlOrAction: `/companies/${company.username}/dashboard/vendors/${vendor.username}/tours`,
            })) || [],
        },
        {
          id: 'tours',
          title: 'Tours',
          urlOrAction: '#',
          icon: PlaneIcon,
          items: [
            {
              id: 'agent-tours.index',
              title: 'Products',
              urlOrAction: `/companies/${company.username}/dashboard/agent-tours`,
            },
            {
              id: 'tours.categories',
              title: 'Product Categories',
              urlOrAction: `/companies/${company.username}/dashboard/categories`,
            },
            {
              id: 'tours.cats',
              title: 'My Catalogs',
              urlOrAction: `//${company.username}.${appHost}/tours`,
              target: '_blank',
            },
            {
              id: 'tours.bookings',
              title: 'Order',
              urlOrAction: `#`,
            },
          ],
        },
        {
          id: 'funds',
          title: 'Funds',
          urlOrAction: `/companies/${company.username}/dashboard/wallets`,
          icon: WalletIcon,
          items: [
            {
              id: 'funds.wallets',
              title: 'Wallet',
              urlOrAction: `/companies/${company.username}/dashboard/wallets`,
            },
            {
              id: 'funds.wallet-transactions',
              title: 'Wallet Transactions',
              urlOrAction: `/companies/${company.username}/dashboard/wallet-transactions`,
            },
            {
              id: 'funds.bank-accounts',
              title: 'Bank Accounts',
              urlOrAction: `/companies/${company.username}/dashboard/bank-accounts`,
            },
            {
              id: 'funds.withdrawals',
              title: 'Withdrawals',
              urlOrAction: `/companies/${company.username}/dashboard/withdrawals`,
            },
            {
              id: 'funds.payments',
              title: 'Payment History',
              urlOrAction: `/companies/${company.username}/dashboard/payments`,
            },
          ],
        },
        {
          id: 'marketings',
          title: 'Marketings & Socmeds',
          urlOrAction: '#',
          icon: BoltIcon,
          items: [
            {
              id: 'marketings.landing-page.edit',
              title: 'Edit Landing Page',
              urlOrAction: `/companies/${company.username}/dashboard/page/edit`,
            },
            {
              id: 'marketings.landing-page.view',
              title: 'My Landing Page',
              urlOrAction: `//${company.username}.${appHost}`,
              target: '_blank',
            },
            {
              id: 'marketings.socmed-analytics',
              title: 'Social Media Analytics',
              urlOrAction: `#`,
            },
            {
              id: 'marketings.budgeting',
              title: 'Promotion Budgetting',
              urlOrAction: `#`,
            },
          ],
        },
        {
          id: 'customers',
          title: 'Customers',
          urlOrAction: `/companies/${company.username}/dashboard/customers`,
          icon: BookUserIcon,
        },
        {
          id: 'reports',
          title: 'Reports',
          urlOrAction: '#',
          icon: BoltIcon,
          items: [
            {
              id: 'reports.inventories',
              title: 'Inventories',
              urlOrAction: `#`,
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
              urlOrAction: `/companies/${company.username}/dashboard/profile`,
            },
            {
              id: 'settings.teams',
              title: 'User Management',
              urlOrAction: `/companies/${company.username}/dashboard/teams`,
            },
            {
              id: 'settings.roles',
              title: 'Access Roles',
              urlOrAction: `/companies/${company.username}/dashboard/roles`,
            },
            {
              id: 'settings.chatbot',
              title: 'Chat AI',
              urlOrAction: `/companies/${company.username}/dashboard/chatbot`,
            },
            {
              id: 'settings.vendor-regs',
              title: 'Vendor Registrations',
              urlOrAction: `/companies/${company.username}/dashboard/vendor-registrations`,
            },
          ],
        },
      ] as MenuItem[]);
}
