import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import {
  BriefcaseIcon,
  HomeIcon,
  SettingsIcon,
  UsersIcon,
  UsersRoundIcon,
  WalletIcon,
} from 'lucide-react';
import { useMemo } from 'react';

type MenuItem = {
  id: string;
  title: string;
  urlOrAction: string | (() => void);
  icon?: any;
  items?: MenuItem[];
};

export function useAffiliateDashboardNavMainMenu() {
  const { auth } = usePageSharedDataProps();
  const user = auth?.user;
  const profile = user?.affiliate_profile || user?.affiliateProfile;
  const tier = profile?.tier;

  const isPartner = tier === 'partner';
  const isMaster = tier === 'master_affiliate' || tier === 'master-affiliate';
  const isApproved = isPartner || isMaster || profile?.status === 'approved';

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

    const menuItems: MenuItem[] = [
      {
        id: 'home',
        title: 'Dashboard',
        urlOrAction: '/affiliate/dashboard',
        icon: HomeIcon,
      },
    ];

    // Menu Partner
    if (isPartner) {
      menuItems.push(
        {
          id: 'network_ma',
          title: 'Master Affiliate',
          urlOrAction: '#',
          icon: BriefcaseIcon,
          items: [
            {
              id: 'network_ma.approvals',
              title: 'MA Approval',
              urlOrAction: '/affiliate/dashboard/network/approvals?tier=ma',
            },
            {
              id: 'network_ma.list',
              title: 'MA List',
              urlOrAction: '/affiliate/dashboard/network/list?tier=ma',
            },
          ],
        },
        {
          id: 'network_affiliate_list',
          title: 'Affiliate List',
          urlOrAction: '/affiliate/dashboard/network/list?tier=affiliate',
          icon: UsersRoundIcon,
        },
        {
          id: 'agent_list',
          title: 'Agent List',
          urlOrAction: '/affiliate/dashboard/agent/list',
          icon: UsersIcon,
        },
      );
    }
    // Menu Master Affiliate
    else if (isMaster) {
      menuItems.push(
        {
          id: 'network_affiliate',
          title: 'Affiliate',
          urlOrAction: '#',
          icon: UsersRoundIcon,
          items: [
            {
              id: 'network_affiliate.approvals',
              title: 'Affiliate Approval',
              urlOrAction:
                '/affiliate/dashboard/network/approvals?tier=affiliate',
            },
            {
              id: 'network_affiliate.list',
              title: 'Affiliate List',
              urlOrAction: '/affiliate/dashboard/network/list?tier=affiliate',
            },
          ],
        },
        {
          id: 'agent_list',
          title: 'Agent List',
          urlOrAction: '/affiliate/dashboard/agent/list',
          icon: UsersIcon,
        },
      );
    }
    // Menu Affiliator Biasa
    else {
      menuItems.push({
        id: 'agent_list',
        title: 'Agent List',
        urlOrAction: '/affiliate/dashboard/agent/list',
        icon: UsersIcon,
      });
    }

    // Menu Umum
    menuItems.push(
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
    );

    return menuItems;
  }, [isMaster, isPartner, isApproved]);
}
