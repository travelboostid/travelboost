import { useLocale } from '@/components/locale-context';
import { SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { LOCALES } from '@/config/locale';
import {
    HelpCircleIcon,
    LanguagesIcon,
    MoonIcon,
    Share2Icon,
    SunIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import {
    SidebarMenuRenderer,
    type MenuItem,
} from '../components/sidebar-menu-renderer';

export function NavSecondary() {
    const { locale, setLocale } = useLocale();
    const localeInfo = useMemo(() => {
        return (
            LOCALES.find((l) => l.code === locale) ||
            LOCALES.find((l) => l.code === 'en')!
        );
    }, [locale]);
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
                title: 'Tell a Friend',
                urlOrAction:
                    'https://wa.me/?text=Halo, ikuti TravelBoost untuk mendapatkan kemudahan dalam merencanakan perjalananmu! Kunjungi https://travelboost.co.id sekarang juga!',
                icon: Share2Icon,
                target: '_blank',
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
            {
                title: localeInfo.name,
                urlOrAction: () =>
                    setLocale(localeInfo.code === 'en' ? 'id' : 'en'),
                icon: LanguagesIcon,
                actions: LOCALES.map((l) => ({
                    title: l.name,
                    urlOrAction: () => setLocale(l.code),
                    icon: LanguagesIcon,
                })),
            },
        ] as MenuItem[];
    }, [resolvedTheme, setTheme, localeInfo, setLocale]);
    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Other</SidebarGroupLabel>
            <SidebarMenuRenderer
                menu={menus}
                activeMenuIds={[]}
                openMenuIds={[]}
            />
        </SidebarGroup>
    );
}
