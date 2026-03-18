import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import type { LucideIcon } from 'lucide-react';
import {
  HomeIcon,
  MessageCircleQuestionIcon,
  PlaneIcon,
  SettingsIcon,
  TicketIcon,
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

export default function useUserDashboardNavMainMenu() {
  const { tenant } = usePageSharedDataProps();
  return [
    {
      id: 'home',
      title: 'Home',
      urlOrAction: `/me`,
      icon: HomeIcon,
    },
    tenant && {
      id: 'tours',
      title: 'Tour Catalog',
      urlOrAction: `/tours`,
      icon: PlaneIcon,
      target: '_blank',
    },
    tenant && {
      id: 'tour-bookings',
      title: 'Bookings',
      urlOrAction: `/bookings`,
      icon: TicketIcon,
    },
    tenant && {
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
    tenant && {
      id: 'cs',
      title: 'Customer Service',
      urlOrAction: `#`,
      icon: MessageCircleQuestionIcon,
      items: [
        {
          id: 'cs.chat',
          title: 'Chat',
          urlOrAction: () => {},
        },
        {
          id: 'cs.whatsapp',
          title: 'Chat on WhatsApp',
          urlOrAction: `https://wa.me/62`,
          target: '_blank',
        },
        {
          id: 'cs.email',
          title: 'Chat on Email',
          urlOrAction: `mailto:${tenant?.email || ''}`,
          target: '_blank',
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
          urlOrAction: `/me/profile`,
        },
        {
          id: 'settings.password',
          title: 'Password',
          urlOrAction: `/me/password`,
        },
        {
          id: 'settings.two-factor-auth',
          title: 'Two Factor Auth',
          urlOrAction: `/me/two-factor`,
        },
      ],
    },
  ].filter(Boolean) as MenuItem[];
}
