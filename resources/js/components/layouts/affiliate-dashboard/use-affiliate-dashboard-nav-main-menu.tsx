import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import {
  HomeIcon,
  SettingsIcon,
  UsersIcon,
  UsersRoundIcon,
  WalletIcon,
} from 'lucide-react';
import { useMemo } from 'react';

type MenuItemBase = {
  id: string;
  title: string;
  urlOrAction: string | (() => void);
  target?: React.HTMLAttributeAnchorTarget;
  icon?: any;
};

type MenuItem =
  | (MenuItemBase & { items?: MenuItem[]; actions?: never })
  | (MenuItemBase & { items?: never; actions?: MenuItem[] })
  | (MenuItemBase & { items?: never; actions?: never });

export function useAffiliateDashboardNavMainMenu() {
  const { auth } = usePageSharedDataProps();
  const user = auth?.user;

  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const profile = user?.affiliate_profile || user?.affiliateProfile;
  const tier = profile?.tier;

  const isPartner =
    roles.some((r) => r.name === 'partner') || tier === 'partner';
  const isMaster =
    roles.some(
      (r) => r.name === 'master_affiliate' || r.name === 'master-affiliate',
    ) ||
    tier === 'master_affiliate' ||
    tier === 'master-affiliate';

  const isApproved =
    isPartner ||
    isMaster ||
    profile?.status === 'approved' ||
    profile?.approved_at != null;

  return useMemo(() => {
    if (!isApproved) {
      return [
        {
          id: 'home',
          title: 'Dashboard',
          urlOrAction: '/affiliate/dashboard',
          icon: HomeIcon,
        },
        {
          id: 'setup',
          title: 'Setup',
          urlOrAction: '#',
          icon: SettingsIcon,
          items: [
            {
              id: 'setup.profile',
              title: 'Profile',
              urlOrAction: '/affiliate/dashboard/setup/profile',
            },
          ],
        },
      ] as MenuItem[];
    }

    return [
      {
        id: 'home',
        title: 'Dashboard',
        urlOrAction: '/affiliate/dashboard',
        icon: HomeIcon,
      },
      ...(isMaster || isPartner
        ? [
            {
              id: 'affiliate',
              title: 'Affiliate',
              urlOrAction: '#',
              icon: UsersRoundIcon,
              items: [
                {
                  id: 'affiliate.approval',
                  title: 'Affiliate Approval',
                  urlOrAction: '/affiliate/dashboard/affiliate/approvals',
                },
                {
                  id: 'affiliate.list',
                  title: 'Affiliate List',
                  urlOrAction: '/affiliate/dashboard/affiliate/list',
                },
              ],
            },
          ]
        : []),
      {
        id: 'agent',
        title: 'Agent',
        urlOrAction: '#',
        icon: UsersIcon,
        items: [
          {
            id: 'agent.list',
            title: 'Agent List',
            urlOrAction: '/affiliate/dashboard/agent/list',
          },
        ],
      },
      {
        id: 'fund',
        title: 'Fund',
        urlOrAction: '#',
        icon: WalletIcon,
        items: [
          {
            id: 'fund.wallet',
            title: 'Wallet',
            urlOrAction: '/affiliate/dashboard/fund/wallet',
          },
          {
            id: 'fund.transaction',
            title: 'Wallet Transaction',
            urlOrAction: '/affiliate/dashboard/fund/transactions',
          },
          {
            id: 'fund.withdraw',
            title: 'Withdraw',
            urlOrAction: '/affiliate/dashboard/fund/withdrawals',
          },
          {
            id: 'fund.history',
            title: 'Payment History',
            urlOrAction: '/affiliate/dashboard/fund/payments',
          },
          {
            id: 'fund.bank',
            title: 'Bank Account',
            urlOrAction: '/affiliate/dashboard/fund/bank-accounts',
          },
        ],
      },
      {
        id: 'setup',
        title: 'Settings',
        urlOrAction: '#',
        icon: SettingsIcon,
        items: [
          {
            id: 'setup.profile',
            title: 'Profile',
            urlOrAction: '/affiliate/dashboard/setup/profile',
          },
          {
            id: 'setup.password',
            title: 'Change Password',
            urlOrAction: '/affiliate/dashboard/setup/password',
          },
        ],
      },
    ] as MenuItem[];
  }, [isMaster, isPartner, isApproved]);
}
