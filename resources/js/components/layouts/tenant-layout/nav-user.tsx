'use client';

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
import {
  BellIcon,
  ChevronDownIcon,
  KeyRoundIcon,
  LogOutIcon,
  UserCogIcon,
  UserIcon,
} from 'lucide-react';

export function NavUser({
  onNavigateAway,
}: {
  onNavigateAway?: (href: string) => void;
}) {
  const { auth } = usePageSharedDataProps();
  const href = '/me';

  const handleClick = (event: MouseEvent) => {
    if (!onNavigateAway) {
      return;
    }

    event.preventDefault();
    onNavigateAway(href);
  };

  const handleLogout = () => {
    router.post('/logout');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
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
          <ChevronDownIcon className="size-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
            <Avatar className="size-8 rounded-lg">
              <AvatarImage
                src={auth.user.photo_url || DEFAULT_PHOTO}
                alt={auth.user.name}
              />
              <AvatarFallback className="rounded-lg">
                <UserIcon />
              </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate font-medium">{auth.user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {auth.user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link className="w-full cursor-pointer" href="/me/profile">
              <UserCogIcon />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link className="w-full cursor-pointer" href="/me/password">
              <KeyRoundIcon />
              Change Password
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <BellIcon />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOutIcon />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
