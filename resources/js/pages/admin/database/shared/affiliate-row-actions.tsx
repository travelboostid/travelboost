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
import { edit as editUser } from '@/routes/admin/database/users';
import { Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import { Ban, EyeIcon, MoreHorizontal, PencilIcon } from 'lucide-react';
import { useState } from 'react';
import type {
    AdminAffiliateRow,
    AdminMasterAffiliateRow,
    InvitedAffiliate,
    NetworkPerson,
} from './affiliate-types';

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

function InactiveIcon({ inactive }: { inactive?: boolean }) {
    if (!inactive) {
        return null;
    }

    return <Ban className="size-3.5 text-rose-500" aria-hidden="true" />;
}

function NetworkPersonDetails({
    label,
    person,
}: {
    label: string;
    person?: NetworkPerson | null;
}) {
    if (!person) {
        return <DetailRow label={label} value={undefined} />;
    }

    return (
        <DetailRow
            label={label}
            value={
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <p>{person.name || '—'}</p>
                        <InactiveIcon inactive={person.is_inactive} />
                    </div>
                    {person.email ? (
                        <p className="text-xs font-normal text-muted-foreground">
                            {person.email}
                        </p>
                    ) : null}
                    {person.referral_code ? (
                        <Badge
                            variant="outline"
                            className="font-mono text-[11px]"
                        >
                            {person.referral_code}
                        </Badge>
                    ) : null}
                </div>
            }
        />
    );
}

function StatusBadge({ status }: { status?: string | null }) {
    const value = status || 'pending';

    return (
        <Badge
            variant={value === 'approved' ? 'secondary' : 'outline'}
            className="capitalize"
        >
            {value.replace(/_/g, ' ')}
        </Badge>
    );
}

function InvitedAffiliatesList({
    affiliates,
}: {
    affiliates: InvitedAffiliate[];
}) {
    if (affiliates.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No invited affiliates yet.
            </p>
        );
    }

    return (
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
            {affiliates.map((affiliate) => (
                <div
                    key={affiliate.id}
                    className="flex flex-col gap-1 border-b border-border pb-2 last:border-b-0 last:pb-0"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                            {affiliate.name || '—'}
                        </span>
                        <InactiveIcon inactive={affiliate.is_inactive} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {affiliate.email || '—'}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        {affiliate.referral_code ? (
                            <Badge
                                variant="outline"
                                className="font-mono text-[11px]"
                            >
                                {affiliate.referral_code}
                            </Badge>
                        ) : null}
                        <StatusBadge status={affiliate.status} />
                    </div>
                </div>
            ))}
        </div>
    );
}

type AffiliateRowActionsProps = {
    affiliate: AdminAffiliateRow;
};

export function AffiliateRowActions({ affiliate }: AffiliateRowActionsProps) {
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
                            href={editUser({ user: affiliate.user_id }).url}
                            className="flex items-center gap-2"
                        >
                            <PencilIcon className="size-4" />
                            Edit
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>Affiliate details</DialogTitle>
                    </DialogHeader>
                    <div className="py-1">
                        <DetailRow label="ID" value={affiliate.id} />
                        <DetailRow label="User ID" value={affiliate.user_id} />
                        <DetailRow label="Name" value={affiliate.name} />
                        <DetailRow label="Email" value={affiliate.email} />
                        <DetailRow label="Phone" value={affiliate.phone} />
                        <DetailRow
                            label="Referral code"
                            value={
                                affiliate.referral_code ? (
                                    <Badge
                                        variant="outline"
                                        className="font-mono text-[11px]"
                                    >
                                        {affiliate.referral_code}
                                    </Badge>
                                ) : undefined
                            }
                        />
                        <DetailRow
                            label="Profile status"
                            value={<StatusBadge status={affiliate.status} />}
                        />
                        <DetailRow
                            label="User status"
                            value={
                                affiliate.user_status ? (
                                    <span className="capitalize">
                                        {affiliate.user_status}
                                    </span>
                                ) : undefined
                            }
                        />
                        <NetworkPersonDetails
                            label="Master affiliate"
                            person={affiliate.master_affiliate}
                        />
                        <NetworkPersonDetails
                            label="Partner"
                            person={affiliate.partner}
                        />
                        <DetailRow
                            label="Invited agents"
                            value={affiliate.invited_agents_count}
                        />
                        <DetailRow
                            label="Subscribed agents"
                            value={affiliate.subscribed_agents_count}
                        />
                        <DetailRow label="Note" value={affiliate.note} />
                        <DetailRow
                            label="Joined"
                            value={
                                affiliate.created_at
                                    ? dayjs(affiliate.created_at).format(
                                          'D MMM YYYY, HH:mm',
                                      )
                                    : undefined
                            }
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

type MasterAffiliateRowActionsProps = {
    masterAffiliate: AdminMasterAffiliateRow;
};

export function MasterAffiliateRowActions({
    masterAffiliate,
}: MasterAffiliateRowActionsProps) {
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
                            href={
                                editUser({ user: masterAffiliate.user_id }).url
                            }
                            className="flex items-center gap-2"
                        >
                            <PencilIcon className="size-4" />
                            Edit
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="sm:max-w-[560px]">
                    <DialogHeader>
                        <DialogTitle>Master affiliate details</DialogTitle>
                    </DialogHeader>
                    <div className="py-1">
                        <DetailRow label="ID" value={masterAffiliate.id} />
                        <DetailRow
                            label="User ID"
                            value={masterAffiliate.user_id}
                        />
                        <DetailRow label="Name" value={masterAffiliate.name} />
                        <DetailRow
                            label="Email"
                            value={masterAffiliate.email}
                        />
                        <DetailRow
                            label="Phone"
                            value={masterAffiliate.phone}
                        />
                        <DetailRow
                            label="Referral code"
                            value={
                                masterAffiliate.referral_code ? (
                                    <Badge
                                        variant="outline"
                                        className="font-mono text-[11px]"
                                    >
                                        {masterAffiliate.referral_code}
                                    </Badge>
                                ) : undefined
                            }
                        />
                        <DetailRow
                            label="Profile status"
                            value={
                                <StatusBadge status={masterAffiliate.status} />
                            }
                        />
                        <DetailRow
                            label="User status"
                            value={
                                masterAffiliate.user_status ? (
                                    <span className="capitalize">
                                        {masterAffiliate.user_status}
                                    </span>
                                ) : undefined
                            }
                        />
                        <NetworkPersonDetails
                            label="Partner"
                            person={masterAffiliate.partner}
                        />
                        <DetailRow
                            label="Invited affiliates"
                            value={masterAffiliate.invited_affiliates_count}
                        />
                        <div className="py-2.5">
                            <p className="mb-2 text-sm font-medium text-muted-foreground">
                                Invited affiliate list
                            </p>
                            <InvitedAffiliatesList
                                affiliates={masterAffiliate.invited_affiliates}
                            />
                        </div>
                        <DetailRow label="Note" value={masterAffiliate.note} />
                        <DetailRow
                            label="Joined"
                            value={
                                masterAffiliate.created_at
                                    ? dayjs(masterAffiliate.created_at).format(
                                          'D MMM YYYY, HH:mm',
                                      )
                                    : undefined
                            }
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function AffiliateStatusBadge({ status }: { status?: string | null }) {
    if (!status) {
        return <span className="text-sm text-muted-foreground">—</span>;
    }

    return (
        <Badge
            variant="secondary"
            className={cn(
                'capitalize',
                status === 'approved' &&
                    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                status === 'rejected' &&
                    'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
                status === 'pending' &&
                    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
            )}
        >
            {status.replace(/_/g, ' ')}
        </Badge>
    );
}
