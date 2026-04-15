import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DEFAULT_PHOTO } from '@/config';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { router } from '@inertiajs/react';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function NavUser() {
  const { auth } = usePageSharedDataProps();
  const { resolvedTheme, setTheme } = useTheme();

  const user = auth?.user;
  const profile = user?.affiliate_profile || user?.affiliateProfile;
  const tier = profile?.tier?.replace(/[-_]/g, ' ') || 'Affiliator';

  const avatarUrl = profile?.profile_photo_path
    ? `/storage/${profile.profile_photo_path}`
    : user?.photo_url || DEFAULT_PHOTO;

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
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-3 px-2 py-2 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={avatarUrl}
                alt={user?.name}
                className="object-cover"
              />
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

        <DropdownMenuItem
          onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
          className="cursor-pointer py-2"
        >
          {resolvedTheme === 'light' ? (
            <Moon className="mr-2 h-4 w-4" />
          ) : (
            <Sun className="mr-2 h-4 w-4" />
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
