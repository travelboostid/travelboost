import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { ExternalLink, Globe, HelpCircle, Share2 } from 'lucide-react';
import React from 'react';

export function NavSecondary({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
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
                                href="https://wa.me/6289654401230"
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
                            className="h-10 rounded-xl px-3 text-[0.92rem] font-medium transition-all hover:bg-white hover:shadow-sm dark:hover:bg-slate-900"
                            asChild
                        >
                            <a
                                href="#"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between w-full"
                            >
                                <div className="flex items-center gap-2">
                                    <Share2 className="size-4" />
                                    <span>Share Link</span>
                                </div>
                                <ExternalLink className="size-3 text-muted-foreground" />
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="h-10 rounded-xl px-3 text-[0.92rem] font-medium transition-all hover:bg-white hover:shadow-sm dark:hover:bg-slate-900"
                            asChild
                        >
                            <a
                                href="#"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between w-full"
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
