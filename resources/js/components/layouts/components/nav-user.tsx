import { Bell, ChevronsUpDown, KeyIcon, LogOut, UserIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
import { edit as editPassword } from '@/routes/me/user-password';
import { Link, router } from '@inertiajs/react';
import { FormattedMessage } from 'react-intl';

export function NavUser() {
    const { isMobile } = useSidebar();
    const { auth, company } = usePageSharedDataProps();

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="h-14 rounded-2xl px-2.5 transition-all hover:bg-slate-50 hover:shadow-sm data-[state=open]:bg-slate-50 data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-0! dark:hover:bg-slate-900 dark:data-[state=open]:bg-slate-900"
                        >
                            <Avatar className="h-10 w-10 rounded-2xl ring-1 ring-slate-200/80 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9 dark:ring-slate-800">
                                <AvatarImage
                                    src={auth.user.photo_url || DEFAULT_PHOTO}
                                    alt={auth.user.name}
                                />
                                <AvatarFallback className="rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                    <UserIcon className="h-5 w-5" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                <span className="truncate font-semibold text-slate-950 dark:text-white">
                                    {auth.user.name}
                                </span>
                                <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                                    {auth.user.email}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4 text-slate-400 group-data-[collapsible=icon]:hidden" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage
                                        src={
                                            auth.user.photo_url || DEFAULT_PHOTO
                                        }
                                        alt={auth.user.name}
                                    />
                                    <AvatarFallback>
                                        <UserIcon />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {auth.user.name}
                                    </span>
                                    <span className="truncate text-xs">
                                        {auth.user.email}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {/* <DropdownMenuItem asChild>
                <Link
                  className="block w-full cursor-pointer"
                  href={edit().url}
                  prefetch
                >
                  <BadgeCheck />
                  My Profile
                </Link>
              </DropdownMenuItem> */}
                            <DropdownMenuItem asChild>
                                <Link
                                    className="block w-full cursor-pointer"
                                    href={editPassword().url}
                                    prefetch
                                >
                                    <KeyIcon />
                                    <FormattedMessage defaultMessage="Change Password" />
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link
                                    className="block w-full cursor-pointer"
                                    href={
                                        company?.username
                                            ? `/companies/${company.username}/dashboard/notifications`
                                            : '#'
                                    }
                                    prefetch
                                >
                                    <Bell />
                                    Notifications
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="cursor-pointer"
                        >
                            <LogOut />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
