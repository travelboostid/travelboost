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

type MenuItem = {
  id: string;
  title: string;
  urlOrAction: string | (() => void);
  target?: HTMLAttributeAnchorTarget;
  icon?: LucideIcon;
  items?: MenuItem[];
};

export function useCompanyDashboardNavMainMenu() {
  const { company } = usePageSharedDataProps();

  return company.type === 'vendor'
    ? ([
        {
          id: 'home',
          title: 'Home',
          urlOrAction: `/companies/${company.username}/dashboard`,
          icon: HomeIcon,
        },
        {
          id: 'agents',
          title: 'Agents',
          urlOrAction: '#',
          icon: UsersRoundIcon,
          items: [
            {
              id: 'agents.index',
              title: 'Agent List',
              urlOrAction: `/companies/${company.username}/dashboard/agents`,
            },
            {
              id: 'agents.approvals',
              title: 'Agent Approvals',
              urlOrAction: `/companies/${company.username}/dashboard/agent-approvals`,
            },
          ],
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
              urlOrAction: `#`,
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
          urlOrAction: '#',
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
              urlOrAction: `/companies/${company.username}/dashboard/settings/profile`,
            },
            {
              id: 'settings.members',
              title: 'User Management',
              urlOrAction: `/companies/${company.username}/dashboard/settings/members`,
            },
            {
              id: 'settings.chatbot',
              title: 'Chat AI',
              urlOrAction: `/companies/${company.username}/dashboard/settings/chatbot`,
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
          items: [
            {
              id: 'vendor-tours.root',
              title: 'Root',
              urlOrAction: `/companies/${company.username}/dashboard/vendors/root/tours`,
            },
          ],
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
              urlOrAction: `#`,
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
              id: 'marketings.landing-page',
              title: 'My Landing Page',
              urlOrAction: `/${company.username}/design`,
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
          urlOrAction: '#',
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
              urlOrAction: `/companies/${company.username}/dashboard/settings/profile`,
            },
            {
              id: 'settings.members',
              title: 'User Management',
              urlOrAction: `/companies/${company.username}/dashboard/settings/members`,
            },
            {
              id: 'settings.chatbot',
              title: 'Chat AI',
              urlOrAction: `/companies/${company.username}/dashboard/settings/chatbot`,
            },
            {
              id: 'settings.vendor-regs',
              title: 'Vendor Registrations',
              urlOrAction: `#`,
            },
          ],
        },
      ] as MenuItem[]);
}
