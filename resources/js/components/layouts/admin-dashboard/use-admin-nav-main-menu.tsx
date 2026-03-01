import type { LucideIcon } from 'lucide-react';
import { HomeIcon, UserIcon } from 'lucide-react';
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
      id: 'users',
      title: 'Users',
      urlOrAction: `/admin/users`,
      icon: UserIcon,
    },
    {
      id: 'companies',
      title: 'Companies',
      urlOrAction: `#`,
      icon: UserIcon,
      items: [
        {
          id: 'companies.vendors',
          title: 'Vendors',
          urlOrAction: `/admin/vendors`,
        },
        {
          id: 'companies.agents',
          title: 'Agents',
          urlOrAction: `/admin/agents`,
        },
      ],
    },
  ].filter(Boolean) as MenuItem[];
}
