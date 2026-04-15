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
import { FormattedMessage } from 'react-intl';

type MenuItemBase = {
  id: string;
  title: string;
  urlOrAction: string | (() => void);
  target?: HTMLAttributeAnchorTarget;
  icon?: LucideIcon;
  visibleToPermissions?: string[]; // Optional permissions to control visibility
  visibleToCompanyTypes?: string[]; // Optional company types to control visibility
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
  const { company, auth } = usePageSharedDataProps();

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
  // const companySubdomain =
  //   `${scheme}://${company.subdomain}.${appHost}${appPort ? `:${appPort}` : ''}`;
  //

  const unfilteredMenus = [
    {
      id: 'home',
      title: <FormattedMessage defaultMessage="Home" />,
      urlOrAction: `/companies/${company.username}/dashboard`,
      icon: HomeIcon,
      visibleToCompanyTypes: ['vendor', 'agent'],
    },
    {
      id: 'vendor-tours',
      title: <FormattedMessage defaultMessage="Vendor Catalogs" />,
      urlOrAction: '#',
      icon: FolderSearchIcon,
      items:
        (data?.data || []).map((vendor) => ({
          id: `vendor-tours.${vendor.id}`,
          title: vendor.name,
          urlOrAction: `/companies/${company.username}/dashboard/vendors/${vendor.username}/tours`,
        })) || [],
      visibleToCompanyTypes: ['agent'],
      visibleToPermissions: ['tour.read'],
    },
    {
      id: 'agent-registrations',
      title: 'Agents',
      urlOrAction: `/companies/${company.username}/dashboard/agent-registrations`,
      icon: UsersRoundIcon,
      visibleToCompanyTypes: ['vendor'],
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
          //31032026
          //urlOrAction: companySubdomain,
          urlOrAction: `/companies/${company.username}/dashboard/vendors/${company.username}/tours`,
          //target: '_blank',
        },
        {
          id: 'tours.orders',
          title: 'Orders',
          urlOrAction: `/companies/${company.username}/dashboard/orders`,
        },
      ],
      visibleToCompanyTypes: ['vendor'],
      visibleToPermissions: ['tour.read'],
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
          urlOrAction: `/companies/${company.username}/dashboard/vendors/${company.username}/tours`,
        },
        {
          id: 'tours.bookings',
          title: 'Order',
          urlOrAction: `#`,
        },
      ],
      visibleToCompanyTypes: ['agent'],
      visibleToPermissions: ['tour.read'],
    },
    {
      id: 'customers',
      title: 'Customers',
      urlOrAction: `/companies/${company.username}/dashboard/customers`,
      icon: BookUserIcon,
      visibleToCompanyTypes: ['agent'],
      visibleToPermissions: ['user.read'],
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
      visibleToCompanyTypes: ['agent', 'vendor'],
      visibleToPermissions: ['wallet.read'],
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
          urlOrAction: companySubdomain,
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
      visibleToCompanyTypes: ['agent'],
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
        {
          id: 'settings.ai-credits',
          title: 'AI Credits',
          urlOrAction: `/companies/${company.username}/dashboard/ai-credits`,
        },
        {
          id: 'settings.vendor-registrations',
          title: 'Vendor Registrations',
          urlOrAction: `/companies/${company.username}/dashboard/vendor-registrations`,
          visibleToCompanyTypes: ['agent'],
        },
      ],
      visibleToCompanyTypes: ['agent', 'vendor'],
      visibleToPermissions: ['company.read'],
    },
  ] as MenuItem[];

  const isMenuVisible = (menu: MenuItem): boolean => {
    // Check company type visibility
    if (menu.visibleToCompanyTypes) {
      if (!menu.visibleToCompanyTypes.includes(company.type)) {
        return false;
      }
    }
    if (menu.visibleToPermissions) {
      const hasPermission = menu.visibleToPermissions.some((permission) =>
        auth.permissions.includes(permission),
      );
      if (!hasPermission) {
        return false;
      }
    }
    return true;
  };

  // Recursive function to filter menu items based on visibility. Includes submenus.
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
