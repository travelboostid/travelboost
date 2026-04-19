import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { ExternalLink, Globe, HelpCircle, Share2 } from 'lucide-react';
import React from 'react';

export function NavSecondary({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup className={className} {...props}>
      <SidebarGroupLabel>Others</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
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
            <SidebarMenuButton asChild>
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
            <SidebarMenuButton asChild>
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
