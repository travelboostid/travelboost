import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import type { LucideIcon } from 'lucide-react';
import {
  HelpCircleIcon,
  MoonIcon,
  MoreHorizontalIcon,
  Share2Icon,
  SunIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';

type MenuItem = {
  name: string;
  target?: HTMLAnchorElement['target'];
  urlOrAction: string | (() => void);
  icon: LucideIcon;
  submenu?: Omit<MenuItem, 'submenu'>[];
};

export function NavSecondary() {
  const { resolvedTheme, setTheme } = useTheme();
  const { isMobile } = useSidebar();
  const menus: MenuItem[] = useMemo(() => {
    return [
      {
        name: 'Help',
        urlOrAction: 'https://wa.me/6289654401230',
        target: '_blank',
        icon: HelpCircleIcon,
      },
      {
        name: 'Tell a Friend',
        urlOrAction:
          'https://wa.me/?text=Halo, ikuti TravelBoost untuk mendapatkan kemudahan dalam merencanakan perjalananmu! Kunjungi https://travelboost.co.id sekarang juga!',
        icon: Share2Icon,
        target: '_blank',
      },
      {
        name: 'Theme',
        urlOrAction: () =>
          setTheme(resolvedTheme === 'light' ? 'dark' : 'light'),
        icon: resolvedTheme === 'light' ? SunIcon : MoonIcon,
        submenu: [
          {
            name: 'Light',
            urlOrAction: () => setTheme('light'),
            icon: SunIcon,
          },
          {
            name: 'Dark',
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
      <SidebarMenu>
        {menus.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a
                onClick={
                  typeof item.urlOrAction === 'function'
                    ? item.urlOrAction
                    : undefined
                }
                href={
                  typeof item.urlOrAction === 'string'
                    ? item.urlOrAction
                    : undefined
                }
                target={item.target}
                className="flex items-center gap-2"
              >
                <item.icon />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
            {item.submenu && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontalIcon />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 rounded-lg"
                  side={isMobile ? 'bottom' : 'right'}
                  align={isMobile ? 'end' : 'start'}
                >
                  {item.submenu.map((subItem) => (
                    <DropdownMenuItem
                      key={subItem.name}
                      asChild
                      onClick={
                        typeof subItem.urlOrAction === 'function'
                          ? subItem.urlOrAction
                          : undefined
                      }
                    >
                      <a
                        className="flex items-center gap-2 w-full"
                        href={
                          typeof subItem.urlOrAction === 'string'
                            ? subItem.urlOrAction
                            : undefined
                        }
                        target={subItem.target}
                      >
                        <subItem.icon className="text-muted-foreground" />
                        {subItem.name}
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
