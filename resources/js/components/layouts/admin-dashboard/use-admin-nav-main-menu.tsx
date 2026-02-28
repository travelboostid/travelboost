import type { LucideIcon } from 'lucide-react';
import {
  BarChart3Icon,
  BookOpenIcon,
  DatabaseIcon,
  HomeIcon,
  SettingsIcon,
  ShoppingCartIcon,
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

export default function useAdminNavMainMenu() {
  return [
    {
      id: 'home',
      title: 'Home',
      urlOrAction: `/admin/dashboard`,
      icon: HomeIcon,
    },
    {
      id: 'database',
      title: 'Database',
      urlOrAction: '#',
      icon: DatabaseIcon,
      items: [
        {
          id: 'database.vendor',
          title: 'Vendor',
          urlOrAction: `/admin/vendors`,
        },
        { id: 'database.agent', title: 'Agent', urlOrAction: `/admin/agents` },
        {
          id: 'database.affiliate',
          title: 'Master Affiliate & Affiliator',
          urlOrAction: `/admin/affiliates`,
        },
        {
          id: 'database.guest',
          title: 'Guest / Customer',
          urlOrAction: `/admin/customers`,
        },
        { id: 'database.tour', title: 'Tour', urlOrAction: `/admin/tours` },
      ],
    },
    {
      id: 'products',
      title: 'Products',
      urlOrAction: '#',
      icon: ShoppingCartIcon,
      items: [
        {
          id: 'products.catalog',
          title: 'Product Catalog',
          urlOrAction: `/admin/products`,
        },
        {
          id: 'products.vendor-catalog',
          title: 'Vendor Catalog',
          urlOrAction: `/admin/vendor-catalog`,
        },
      ],
    },
    {
      id: 'bookings',
      title: 'Booking / Order',
      urlOrAction: `/admin/bookings`,
      icon: BookOpenIcon,
    },
    {
      id: 'funds',
      title: 'Funds',
      urlOrAction: '#',
      icon: WalletIcon,
      items: [
        { id: 'funds.wallet', title: 'Wallet', urlOrAction: `/admin/wallets` },
        {
          id: 'funds.transactions',
          title: 'Wallet Transaction',
          urlOrAction: `/admin/wallet-transactions`,
        },
        {
          id: 'funds.withdrawal',
          title: 'Withdraw',
          urlOrAction: `/admin/withdrawals`,
        },
        {
          id: 'funds.payment',
          title: 'Payment History',
          urlOrAction: `/admin/payments`,
        },
        {
          id: 'funds.bank',
          title: 'Bank Account',
          urlOrAction: `/admin/bank-accounts`,
        },
      ],
    },
    {
      id: 'reports',
      title: 'Report',
      urlOrAction: `/admin/reports`,
      icon: BarChart3Icon,
    },
    {
      id: 'setup',
      title: 'Setup',
      urlOrAction: '#',
      icon: SettingsIcon,
      items: [
        {
          id: 'setup.inventory',
          title: 'Inventory Status',
          urlOrAction: `/admin/inventory-status`,
        },
        {
          id: 'setup.users',
          title: 'User Management',
          urlOrAction: `/admin/users`,
        },
      ],
    },
  ].filter(Boolean) as MenuItem[];
}
