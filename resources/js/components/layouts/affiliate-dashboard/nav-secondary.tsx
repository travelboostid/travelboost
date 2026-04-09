import { SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { HelpCircleIcon, MoonIcon, Share2Icon, SunIcon } from 'lucide-react';
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
        title: 'Bantuan',
        urlOrAction: 'https://wa.me/6289654401230',
        target: '_blank',
        icon: HelpCircleIcon,
      },
      {
        title: 'Bagikan Link',
        urlOrAction: 'https://wa.me/?text=Daftar TravelBoost sekarang!',
        icon: Share2Icon,
        target: '_blank',
      },
      {
        title: 'Tema Tampilan',
        urlOrAction: () =>
          setTheme(resolvedTheme === 'light' ? 'dark' : 'light'),
        icon: resolvedTheme === 'light' ? SunIcon : MoonIcon,
        actions: [
          {
            title: 'Terang',
            urlOrAction: () => setTheme('light'),
            icon: SunIcon,
          },
          {
            title: 'Gelap',
            urlOrAction: () => setTheme('dark'),
            icon: MoonIcon,
          },
        ],
      },
    ] as MenuItem[];
  }, [resolvedTheme, setTheme]);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Lainnya</SidebarGroupLabel>
      <SidebarMenuRenderer menu={menus} activeMenuIds={[]} openMenuIds={[]} />
    </SidebarGroup>
  );
}
