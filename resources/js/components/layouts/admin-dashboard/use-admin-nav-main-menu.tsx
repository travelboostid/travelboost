import {
  BoltIcon,
  DatabaseIcon,
  HomeIcon,
  PlaneIcon,
  SettingsIcon,
  WalletIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import type { MenuItem } from '../components/sidebar-menu-renderer';

export default function useAdminNavMainMenu() {
  return useMemo(
    () =>
      [
        {
          id: 'dashboard',
          title: 'Dashboard',
          urlOrAction: `/admin/dashboard`,
          icon: HomeIcon,
        },
        {
          id: 'database',
          title: 'Database',
          urlOrAction: `#`,
          icon: DatabaseIcon,
          items: [
            {
              id: 'database.vendors',
              title: 'Vendor',
              urlOrAction: '/admin/database/vendors',
            },
            {
              id: 'database.agents',
              title: 'Agent',
              urlOrAction: '/admin/database/agents',
            },
            {
              id: 'database.affiliates',
              title: 'Affiliate',
              urlOrAction: '/admin/database/affiliates',
            },
            {
              id: 'database.customers',
              title: 'Customers',
              urlOrAction: '/admin/database/customers',
            },
          ],
        },
        {
          id: 'tour',
          title: 'Tours',
          urlOrAction: '#',
          icon: PlaneIcon,
          items: [
            {
              id: 'tour.products',
              title: 'Products',
              urlOrAction: '/admin/tours/products',
            },
            {
              id: 'tour.vendor-catalogs',
              title: 'Vendor Catalog',
              urlOrAction: '/admin/tours/vendor-catalogs',
            },
            {
              id: 'tour.orders',
              title: 'Orders',
              urlOrAction: '/admin/tours/orders',
            },
          ],
        },
        {
          id: 'fund',
          title: 'Funds',
          urlOrAction: '#',
          icon: WalletIcon,
          items: [
            {
              id: 'fund.wallets',
              title: 'Wallet',
              urlOrAction: '/admin/funds/wallets',
            },
            {
              id: 'fund.payment-history',
              title: 'Payment History',
              urlOrAction: '/admin/funds/payment-history',
            },
            {
              id: 'fund.bank-accounts',
              title: 'Bank Accounts',
              urlOrAction: '/admin/funds/bank-accounts',
            },
          ],
        },
        {
          id: 'withdrawal-requests',
          title: 'Withdrawal Request',
          urlOrAction: '#',
          icon: WalletIcon,
          items: [
            {
              id: 'withdrawal-requests.history',
              title: 'Wallet History',
              urlOrAction: '/admin/funds/wallet-transactions',
            },
            {
              id: 'withdrawal-requests.manage',
              title: 'Withdrawal',
              urlOrAction: '/admin/funds/withdrawals',
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
              id: 'reports.inventories',
              title: 'Inventory Status',
              urlOrAction: '/admin/reports/inventories',
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
              id: 'settings.users',
              title: 'User Management',
              urlOrAction: '/admin/database/users',
            },
            {
              id: 'settings.vouchers',
              title: 'Vouchers',
              urlOrAction: '/admin/vouchers',
            },
          ],
        },
      ] as MenuItem[],
    [],
  );
}
