import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useDataTable } from '@/hooks/use-data-table';
import type { Column, ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { Ban, Text } from 'lucide-react';
import { useMemo } from 'react';

type NetworkPerson = {
    id: number;
    name?: string | null;
    email?: string | null;
    referral_code?: string | null;
    status?: string | null;
    user_status?: string | null;
    is_inactive?: boolean;
};

type InvitedAffiliate = {
    id: number;
    name?: string | null;
    email?: string | null;
    referral_code?: string | null;
    status?: string | null;
    is_inactive?: boolean;
};

type MasterAffiliateRow = {
    id: number;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    referral_code?: string | null;
    status?: string | null;
    user_status?: string | null;
    is_inactive?: boolean;
    partner?: NetworkPerson | null;
    invited_affiliates_count: number;
    invited_affiliates: InvitedAffiliate[];
    created_at?: string | null;
};

type PageProps = {
    data: {
        data: MasterAffiliateRow[];
        total: number;
    };
};

function InactiveIcon({ inactive }: { inactive?: boolean }) {
    if (!inactive) {
        return null;
    }

    return <Ban className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />;
}

function PersonCell({ person }: { person?: NetworkPerson | null }) {
    if (!person) {
        return <span className="text-sm text-slate-400">-</span>;
    }

    return (
        <div className="flex min-w-[150px] items-center gap-2">
            <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {person.name || '-'}
            </span>
            <InactiveIcon inactive={person.is_inactive} />
        </div>
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

function InvitedAffiliatesDialog({ row }: { row: MasterAffiliateRow }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-8 px-2 text-sm font-medium text-primary hover:text-primary"
                >
                    {row.invited_affiliates_count}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Invited Affiliates</DialogTitle>
                    <DialogDescription>
                        Affiliates invited by{' '}
                        {row.name || 'this master affiliate'}.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto rounded-md border">
                    {row.invited_affiliates.length > 0 ? (
                        <div className="divide-y">
                            {row.invited_affiliates.map((affiliate) => (
                                <div
                                    key={affiliate.id}
                                    className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                                {affiliate.name || '-'}
                                            </span>
                                            <InactiveIcon
                                                inactive={affiliate.is_inactive}
                                            />
                                        </div>
                                        <div className="truncate text-xs text-slate-500">
                                            {affiliate.email || '-'}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {affiliate.referral_code && (
                                            <Badge
                                                variant="secondary"
                                                className="font-mono text-[11px]"
                                            >
                                                {affiliate.referral_code}
                                            </Badge>
                                        )}
                                        <StatusBadge
                                            status={affiliate.status}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-sm text-slate-500">
                            No invited affiliates yet.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function Page({ data }: PageProps) {
    const columns = useMemo<ColumnDef<MasterAffiliateRow>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() &&
                                'indeterminate')
                        }
                        onCheckedChange={(value) =>
                            table.toggleAllPageRowsSelected(!!value)
                        }
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                ),
                size: 32,
                enableHiding: false,
            },
            {
                id: 'master_affiliate',
                accessorKey: 'name',
                header: ({
                    column,
                }: {
                    column: Column<MasterAffiliateRow, unknown>;
                }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Master Affiliate"
                    />
                ),
                cell: ({ row }) => (
                    <div className="min-w-[220px] space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                                {row.original.name || '-'}
                            </span>
                            <InactiveIcon inactive={row.original.is_inactive} />
                        </div>
                        <div className="truncate text-xs text-slate-500">
                            {row.original.email || '-'}
                        </div>
                        {row.original.referral_code && (
                            <Badge
                                variant="secondary"
                                className="font-mono text-[11px]"
                            >
                                {row.original.referral_code}
                            </Badge>
                        )}
                    </div>
                ),
                meta: {
                    label: 'Master Affiliate',
                    placeholder: 'Search MA...',
                    variant: 'text',
                    icon: Text,
                },
                enableColumnFilter: true,
            },
            {
                id: 'partner',
                accessorFn: (row) => row.partner?.name || '',
                header: ({
                    column,
                }: {
                    column: Column<MasterAffiliateRow, unknown>;
                }) => <DataTableColumnHeader column={column} label="Partner" />,
                cell: ({ row }) => <PersonCell person={row.original.partner} />,
            },
            {
                id: 'invited_affiliates_count',
                accessorKey: 'invited_affiliates_count',
                header: ({
                    column,
                }: {
                    column: Column<MasterAffiliateRow, unknown>;
                }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Invited Affiliates"
                    />
                ),
                cell: ({ row }) => (
                    <InvitedAffiliatesDialog row={row.original} />
                ),
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: ({
                    column,
                }: {
                    column: Column<MasterAffiliateRow, unknown>;
                }) => <DataTableColumnHeader column={column} label="Status" />,
                cell: ({ row }) => <StatusBadge status={row.original.status} />,
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({
                    column,
                }: {
                    column: Column<MasterAffiliateRow, unknown>;
                }) => (
                    <DataTableColumnHeader column={column} label="Join Date" />
                ),
                cell: ({ cell }) => {
                    const createdAt = cell.getValue<string | null>();

                    return (
                        <div className="min-w-[110px] text-sm text-slate-700 dark:text-slate-300">
                            {createdAt
                                ? dayjs(createdAt).format('DD MMM YYYY')
                                : '-'}
                        </div>
                    );
                },
            },
        ],
        [],
    );

    const { table } = useDataTable({
        enableClientFiltering: true,
        queryKeys: {
            perPage: 'per_page',
            page: 'page',
        },
        data: data.data,
        columns,
        pageCount: 1,
        rowCount: data.total,
        shallow: false,
        initialState: {
            sorting: [{ id: 'created_at', desc: true }],
        },
        getRowId: (row) => row.id.toString(),
    });

    return (
        <AdminDashboardLayout
            containerClassName="p-4"
            breadcrumb={[{ title: 'Database' }, { title: 'Master Affiliate' }]}
        >
            <DataTable
                table={table}
                renderEmptyState={
                    <div className="py-8 text-sm text-slate-500">
                        No master affiliates found.
                    </div>
                }
            >
                <DataTableToolbar table={table} searchMode="global" />
            </DataTable>
        </AdminDashboardLayout>
    );
}
