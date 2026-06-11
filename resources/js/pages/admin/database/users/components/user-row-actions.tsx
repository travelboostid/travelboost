import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/admin/database/users';
import { Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import { EyeIcon, MoreHorizontal, PencilIcon } from 'lucide-react';
import { useState } from 'react';

export type AdminUserRow = {
    id: number;
    name: string;
    username?: string | null;
    email: string;
    phone?: string | null;
    address?: string | null;
    gender?: string | null;
    status?: string | null;
    note?: string | null;
    created_at: string;
    email_verified_at?: string | null;
    company?: {
        id: number;
        name: string;
        username?: string;
    } | null;
    roles?: Array<{
        name?: string;
        display_name?: string;
    }>;
};

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-3 items-start gap-4 border-b border-border py-2.5 last:border-b-0">
            <span className="text-sm font-medium text-muted-foreground">
                {label}
            </span>
            <span className="col-span-2 break-words text-sm font-medium text-foreground">
                {value || '—'}
            </span>
        </div>
    );
}

export function UserRowActions({ user }: { user: AdminUserRow }) {
    const [detailsOpen, setDetailsOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                    >
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onSelect={(event) => {
                            event.preventDefault();
                            setDetailsOpen(true);
                        }}
                    >
                        <EyeIcon className="size-4" />
                        View details
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                        <Link
                            href={edit({ user: user.id }).url}
                            className="flex items-center gap-2"
                        >
                            <PencilIcon className="size-4" />
                            Edit
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>User details</DialogTitle>
                    </DialogHeader>
                    <div className="py-1">
                        <DetailRow label="ID" value={user.id} />
                        <DetailRow label="Name" value={user.name} />
                        <DetailRow
                            label="Username"
                            value={
                                user.username ? `@${user.username}` : undefined
                            }
                        />
                        <DetailRow label="Email" value={user.email} />
                        <DetailRow label="Phone" value={user.phone} />
                        <DetailRow
                            label="Gender"
                            value={
                                user.gender ? (
                                    <span className="capitalize">
                                        {user.gender}
                                    </span>
                                ) : undefined
                            }
                        />
                        <DetailRow label="Address" value={user.address} />
                        <DetailRow
                            label="Status"
                            value={
                                user.status ? (
                                    <span
                                        className={cn(
                                            'inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase',
                                            user.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                : user.status === 'suspended'
                                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                                  : 'bg-muted text-muted-foreground',
                                        )}
                                    >
                                        {user.status}
                                    </span>
                                ) : undefined
                            }
                        />
                        <DetailRow
                            label="Company holder"
                            value={user.company?.name}
                        />
                        <DetailRow
                            label="Roles"
                            value={
                                (user.roles?.length ?? 0) > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {user.roles?.map((role, index) => (
                                            <Badge
                                                key={`${role.name}-${index}`}
                                                variant="secondary"
                                                className="font-normal"
                                            >
                                                {role.display_name || role.name}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : undefined
                            }
                        />
                        <DetailRow
                            label="Email verified"
                            value={
                                user.email_verified_at
                                    ? dayjs(user.email_verified_at).format(
                                          'D MMM YYYY, HH:mm',
                                      )
                                    : 'Not verified'
                            }
                        />
                        <DetailRow label="Note" value={user.note} />
                        <DetailRow
                            label="Joined"
                            value={dayjs(user.created_at).format(
                                'D MMM YYYY, HH:mm',
                            )}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
