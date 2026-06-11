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
import { Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import { EyeIcon, MoreHorizontal, PencilIcon } from 'lucide-react';
import { useState } from 'react';
import type { AdminCompanyRow, NetworkPerson } from './company-types';

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
                    <p>{person.name || '—'}</p>
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

type CompanyRowActionsProps = {
    company: AdminCompanyRow;
    entityLabel: 'Agent' | 'Vendor';
    editHref: string;
    showAffiliation?: boolean;
};

export function CompanyRowActions({
    company,
    entityLabel,
    editHref,
    showAffiliation = false,
}: CompanyRowActionsProps) {
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
                            href={editHref}
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
                        <DialogTitle>{entityLabel} details</DialogTitle>
                    </DialogHeader>
                    <div className="py-1">
                        <DetailRow label="ID" value={company.id} />
                        <DetailRow label="Name" value={company.name} />
                        <DetailRow
                            label="Username"
                            value={`@${company.username}`}
                        />
                        <DetailRow label="Email" value={company.email} />
                        <DetailRow label="Phone" value={company.phone} />
                        <DetailRow
                            label="Customer service"
                            value={company.customer_service_phone}
                        />
                        <DetailRow label="Address" value={company.address} />
                        {company.subscription_status ? (
                            <DetailRow
                                label="Subscription"
                                value={
                                    <span className="capitalize">
                                        {company.subscription_status}
                                        {company.subscription_package
                                            ? ` · ${company.subscription_package}`
                                            : ''}
                                    </span>
                                }
                            />
                        ) : null}
                        {company.subscription_ends_at ? (
                            <DetailRow
                                label="Subscription ends"
                                value={dayjs(
                                    company.subscription_ends_at,
                                ).format('D MMM YYYY, HH:mm')}
                            />
                        ) : null}
                        {showAffiliation ? (
                            <>
                                <NetworkPersonDetails
                                    label="Affiliator"
                                    person={company.affiliation?.affiliator}
                                />
                                <NetworkPersonDetails
                                    label="Master affiliate"
                                    person={
                                        company.affiliation?.master_affiliate
                                    }
                                />
                                <NetworkPersonDetails
                                    label="Partner"
                                    person={company.affiliation?.partner}
                                />
                            </>
                        ) : null}
                        <DetailRow label="Note" value={company.note} />
                        <DetailRow
                            label="Joined"
                            value={
                                company.created_at
                                    ? dayjs(company.created_at).format(
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

export function SubscriptionStatusBadge({
    status,
}: {
    status?: string | null;
}) {
    if (!status) {
        return <span className="text-sm text-muted-foreground">—</span>;
    }

    return (
        <Badge
            variant="secondary"
            className={cn(
                'capitalize',
                status === 'active' &&
                    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                status === 'expired' &&
                    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
            )}
        >
            {status}
        </Badge>
    );
}
