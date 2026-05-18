import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Link, router, usePage } from '@inertiajs/react';
import { Bell, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function NavUser() {
  const { auth } = usePageSharedDataProps();
  const { resolvedTheme, setTheme } = useTheme();

  const { unreadNotificationsCount, affiliateUnreadNotificationsCount } =
    usePage<any>().props;

  const user = auth?.user;
  const profile = user?.affiliate_profile || user?.affiliateProfile;
  const tier = profile?.tier?.replace(/[-_]/g, ' ') || 'Affiliator';
  const avatarUrl = profile?.photo_url || null;

  const notificationCount =
    unreadNotificationsCount ?? affiliateUnreadNotificationsCount ?? 0;
  const hasUnread = notificationCount > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 outline-none hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-xl transition-colors">
        <div className="hidden sm:grid flex-1 text-right text-sm leading-tight">
          <span className="truncate font-bold text-slate-900 dark:text-white uppercase text-[13px]">
            {user?.name}'s Dashboard
          </span>
          <span className="truncate text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
            {tier}
          </span>
        </div>

        <div className="relative">
          <Avatar className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700">
            <AvatarImage
              src={avatarUrl}
              alt={user?.name}
              className="object-cover"
            />
            <AvatarFallback className="rounded-xl bg-emerald-100 text-emerald-700 font-bold dark:bg-emerald-900 dark:text-emerald-300">
              {user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>

          {hasUnread && (
            <>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-slate-900"></span>
              </span>
              <span className="absolute -bottom-1 -right-2 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white shadow-sm">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            </>
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-3 px-2 py-2 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              {avatarUrl && (
                <AvatarImage
                  src={avatarUrl}
                  alt={user?.name}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="rounded-lg bg-emerald-100 text-emerald-700 font-bold">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-bold">{user?.name}</span>
              <span className="truncate text-xs text-muted-foreground capitalize">
                {tier}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            href="/affiliate/dashboard/notifications"
            className="cursor-pointer py-2 flex w-full items-center justify-between"
          >
            <div className="flex items-center">
              <div className="relative mr-2">
                <Bell className="h-4 w-4" />
                {hasUnread && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </div>
              <span>Notifications</span>
            </div>
            {hasUnread && (
              <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {notificationCount} New
              </span>
            )}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
          className="cursor-pointer py-2"
        >
          {resolvedTheme === 'light' ? (
            <Moon className="mr-0 h-4 w-4" />
          ) : (
            <Sun className="mr-0 h-4 w-4" />
          )}
          <span>Toggle Theme</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => router.post('/affiliate/logout')}
          className="cursor-pointer text-rose-600 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-950/30 py-2"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
