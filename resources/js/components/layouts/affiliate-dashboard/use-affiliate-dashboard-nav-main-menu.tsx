import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import {
  BoltIcon,
  HomeIcon,
  SettingsIcon,
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

  // Casting ke any[] agar TypeScript mengenali method .some()
  const roles = (user?.roles as any[]) || [];
  const isPartner = roles.some((r) => r.name === 'partner');
  const isMaster = roles.some((r) => r.name === 'master_affiliate');

  return useMemo(() => {
    return [
      {
        id: 'home',
        title: 'Dashboard',
        urlOrAction: '/affiliate/dashboard',
        icon: HomeIcon,
      },
      {
        id: 'network',
        title: 'Jaringan Mitra',
        urlOrAction: '#',
        icon: UsersRoundIcon,
        items: [
          ...(isPartner || isMaster
            ? [
                {
                  id: 'network.sub-mitra',
                  title: 'Daftar Sub-Mitra',
                  urlOrAction: '/affiliate/dashboard/network/sub-mitra',
                },
              ]
            : []),
          {
            id: 'network.agents',
            title: 'Daftar Agen (Customer)',
            urlOrAction: '/affiliate/dashboard/network/agents',
          },
        ],
      },
      {
        id: 'funds',
        title: 'Komisi & Keuangan',
        urlOrAction: '#',
        icon: WalletIcon,
        items: [
          {
            id: 'funds.wallet',
            title: 'Saldo',
            urlOrAction: '/affiliate/dashboard/wallet',
          },
          {
            id: 'funds.commissions',
            title: 'Validasi Komisi',
            urlOrAction: '/affiliate/dashboard/commissions',
          },
          {
            id: 'funds.withdrawals',
            title: 'Penarikan Dana',
            urlOrAction: '/affiliate/dashboard/withdrawals',
          },
        ],
      },
      {
        id: 'marketing',
        title: 'Alat Promosi',
        urlOrAction: '#',
        icon: BoltIcon,
        items: [
          {
            id: 'marketing.links',
            title: 'Link & Landing Page',
            urlOrAction: '/affiliate/dashboard/marketing/links',
          },
        ],
      },
      {
        id: 'settings',
        title: 'Pengaturan',
        urlOrAction: '#',
        icon: SettingsIcon,
        items: [
          {
            id: 'settings.profile',
            title: 'Profil Pribadi',
            urlOrAction: '/affiliate/dashboard/profile',
          },
          {
            id: 'settings.bank',
            title: 'Rekening Bank',
            urlOrAction: '/affiliate/dashboard/bank',
          },
        ],
      },
    ] as MenuItem[];
  }, [isPartner, isMaster]);
}
