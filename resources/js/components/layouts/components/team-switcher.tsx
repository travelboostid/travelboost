'use client';

import { ChevronsUpDown, User2Icon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { DEFAULT_PHOTO } from '@/config';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Link } from '@inertiajs/react';

const COMPANY_TYPE_MAP = {
  vendor: 'Vendor',
  agent: 'Agent',
};

export function TeamSwitcher() {
  const { auth, company } = usePageSharedDataProps();
  const { isMobile } = useSidebar();
  const active = company || auth.user; // if no active company, then it must be user

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={active.photo_url || DEFAULT_PHOTO}
                    alt={active.name}
                  />
                  <AvatarFallback>
                    <User2Icon />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{active.name}</span>
                <span className="truncate text-xs">
                  {COMPANY_TYPE_MAP[
                    active.type as keyof typeof COMPANY_TYPE_MAP
                  ] || 'User'}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              User Dashboard
            </DropdownMenuLabel>
            <DropdownMenuItem
              key={auth.user.name}
              asChild
              className="gap-2 p-2"
            >
              <Link href={`/me`}>
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Avatar className="size-6 rounded-lg">
                    <AvatarImage
                      src={auth.user.photo_url || DEFAULT_PHOTO}
                      alt={auth.user.name}
                    />
                    <AvatarFallback>
                      <User2Icon />
                    </AvatarFallback>
                  </Avatar>
                </div>
                {auth.user.name}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Tour Manager Dashboard
            </DropdownMenuLabel>
            {auth.user.companies.map((company) => (
              <DropdownMenuItem
                key={company.name}
                asChild
                className="gap-2 p-2"
              >
                <Link href={`/companies/${company.username}/dashboard`}>
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Avatar className="size-6 rounded-lg">
                      <AvatarImage
                        src={company.photo_url || DEFAULT_PHOTO}
                        alt={company.name}
                      />
                      <AvatarFallback>
                        <User2Icon />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  {company.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
