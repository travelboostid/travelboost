import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import { ExternalLink, Globe, HelpCircle } from 'lucide-react';
import React from 'react';

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
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
    const { affiliatePageUrl, travelboostWhatsapp } =
        usePageSharedDataProps() as {
            affiliatePageUrl?: string | null;
            travelboostWhatsapp?: string | null;
        };
    const helpUrl = whatsappUrl(travelboostWhatsapp);
    const affiliateUrl = affiliatePageUrl || '#';

    return (
        <SidebarGroup className={cn('gap-1.5 px-2', className)} {...props}>
            <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Others
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="h-10 rounded-xl px-3 text-[0.92rem] font-medium transition-all hover:bg-white hover:shadow-sm dark:hover:bg-slate-900"
                            asChild
                        >
                            <a
                                href={helpUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between w-full"
                            >
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="size-4" />
                                    <span>Help</span>
                                </div>
                                <ExternalLink className="size-3 text-muted-foreground" />
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className={cn(
                                'h-10 rounded-xl px-3 text-[0.92rem] font-medium transition-all hover:bg-white hover:shadow-sm dark:hover:bg-slate-900',
                                !affiliatePageUrl &&
                                    'pointer-events-none opacity-55',
                            )}
                            asChild
                        >
                            <a
                                href={affiliateUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between w-full"
                                aria-disabled={!affiliatePageUrl}
                            >
                                <div className="flex items-center gap-2">
                                    <Globe className="size-4" />
                                    <span>Affiliate Page</span>
                                </div>
                                <ExternalLink className="size-3 text-muted-foreground" />
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
