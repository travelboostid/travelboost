import { useLocale } from '@/components/locale-context';
import { SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { LOCALES } from '@/config/locale';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import {
    HelpCircleIcon,
    LanguagesIcon,
    MoonIcon,
    PhoneCallIcon,
    SunIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import {
    SidebarMenuRenderer,
    type MenuItem,
} from '../components/sidebar-menu-renderer';

function whatsappUrl(phone?: string | null) {
    const digits = (phone || '').replace(/\D/g, '');

    if (!digits) {
        return '#';
    }

    const normalizedPhone = digits.startsWith('0')
        ? `62${digits.slice(1)}`
        : digits;

    return `https://wa.me/${normalizedPhone}`;
}

export function NavSecondary({
    onNavigateAway,
}: {
    onNavigateAway?: (href: string) => void;
}) {
    const { locale, setLocale } = useLocale();
    const { travelboostWhatsapp } = usePageSharedDataProps() as {
        travelboostWhatsapp?: string | null;
    };
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
                urlOrAction: '#',
                icon: HelpCircleIcon,
            },
            {
                title: 'Contact TravelBoost',
                urlOrAction: whatsappUrl(travelboostWhatsapp),
                icon: PhoneCallIcon,
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
    }, [resolvedTheme, setTheme, localeInfo, setLocale, travelboostWhatsapp]);
    return (
        <SidebarGroup className="gap-1.5 px-2 group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Other
            </SidebarGroupLabel>
            <SidebarMenuRenderer
                menu={menus}
                activeMenuIds={[]}
                openMenuIds={[]}
                onNavigateAway={onNavigateAway}
            />
        </SidebarGroup>
    );
}
