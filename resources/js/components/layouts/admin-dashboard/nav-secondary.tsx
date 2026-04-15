import { SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { HelpCircleIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import {
  SidebarMenuRenderer,
  type MenuItem,
} from '../components/sidebar-menu-renderer';

export function NavSecondary() {
  const { resolvedTheme, setTheme } = useTheme();
  const menus: MenuItem[] = useMemo(() => {
    return [
      {
        title: 'Help',
        urlOrAction: 'https://wa.me/6289654401230',
        target: '_blank',
        icon: HelpCircleIcon,
      },
      {
        title: 'Theme',
        urlOrAction: () =>
          setTheme(resolvedTheme === 'light' ? 'dark' : 'light'),
        icon: resolvedTheme === 'light' ? SunIcon : MoonIcon,
        actions: [
          {
            title: 'Light',
            urlOrAction: () => setTheme('light'),
            icon: SunIcon,
          },
          {
            title: 'Dark',
            urlOrAction: () => setTheme('dark'),
            icon: MoonIcon,
          },
        ],
      },
    ] as MenuItem[];
  }, [resolvedTheme, setTheme]);
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Other</SidebarGroupLabel>
      <SidebarMenuRenderer menu={menus} activeMenuIds={[]} openMenuIds={[]} />
    </SidebarGroup>
  );
}
