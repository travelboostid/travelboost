'use client';

import { index } from '@/actions/App/Http/Controllers/Companies/Dashboard/HomeController';
import { edit } from '@/actions/App/Http/Controllers/Me/Settings/ProfileController';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DEFAULT_PHOTO } from '@/config';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Link, router } from '@inertiajs/react';
import { ChevronDown, LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react';
import { useMemo } from 'react';

export function NavUser() {
  const { auth } = usePageSharedDataProps();

  const handleLogout = () => {
    router.post('/logout');
  };

  const navLinks = useMemo(() => {
    const menus = [] as { label: string; href: string }[];
    if (auth.user?.companies?.length) {
      auth.user.companies.map((company) => {
        menus.push({
          label: `${company.name}'s Dashboard`,
          href: index({ company: company.username }).url,
        });
      });
    }

    if (!menus.length) return null;
    return (
      <DropdownMenuGroup>
        {menus.map((menu) => (
          <DropdownMenuItem asChild>
            <Link
              className="block w-full cursor-pointer"
              href={menu.href}
              prefetch
            >
              <UserIcon className="mr-2" />
              {menu.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
    );
  }, [auth]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 px-2">
          <Avatar className="size-6 rounded-lg">
            <AvatarImage
              src={auth.user.photo_url || DEFAULT_PHOTO}
              alt={auth.user.name}
            />
            <AvatarFallback className="rounded-lg">
              <UserIcon />
            </AvatarFallback>
          </Avatar>
          <div className="truncate">{auth?.user?.name}</div>
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="size-8 rounded-lg">
              <AvatarImage
                src={auth.user.photo_url || DEFAULT_PHOTO}
                alt={auth.user.name}
              />
              <AvatarFallback className="rounded-lg">
                <UserIcon />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{auth?.user?.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {auth?.user?.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link
              className="block w-full cursor-pointer"
              href={edit().url}
              prefetch
            >
              <SettingsIcon className="mr-2" />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {navLinks}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600!" onClick={handleLogout}>
          <LogOutIcon className="text-red-600!" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
