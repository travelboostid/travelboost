import type { LucideIcon } from 'lucide-react';
import { HomeIcon, SettingsIcon, WalletIcon } from 'lucide-react';
import type { HTMLAttributeAnchorTarget } from 'react';

type MenuItem = {
  id: string;
  title: string;
  urlOrAction: string | (() => void);
  target?: HTMLAttributeAnchorTarget;
  icon?: LucideIcon;
  items?: MenuItem[];
};

export default function useUserDashboardNavMainMenu() {
  return [
    {
      id: 'home',
      title: 'Home',
      urlOrAction: `/me`,
      icon: HomeIcon,
    },
    {
      id: 'funds',
      title: 'Funds',
      urlOrAction: `/me/wallets`,
      icon: WalletIcon,
      items: [
        {
          id: 'funds.wallets',
          title: 'Wallet',
          urlOrAction: `/me/wallets`,
        },
        {
          id: 'funds.wallet-transactions',
          title: 'Wallet Transactions',
          urlOrAction: `/me/wallet-transactions`,
        },
        {
          id: 'funds.bank-accounts',
          title: 'Bank Accounts',
          urlOrAction: `/me/bank-accounts`,
        },
        {
          id: 'funds.withdrawals',
          title: 'Withdrawals',
          urlOrAction: `/me/withdrawals`,
        },
        {
          id: 'funds.payments',
          title: 'Payment History',
          urlOrAction: `/me/payments`,
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
          urlOrAction: `/me/settings/profile`,
        },
        {
          id: 'settings.password',
          title: 'Password',
          urlOrAction: `/me/settings/password`,
        },
        {
          id: 'settings.two-factor-auth',
          title: 'Two Factor Auth',
          urlOrAction: `/me/settings/two-factor`,
        },
      ],
    },
  ].filter(Boolean) as MenuItem[];
}
