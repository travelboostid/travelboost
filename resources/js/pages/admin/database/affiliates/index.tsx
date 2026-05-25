import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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

type AffiliateRow = {
    id: number;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    referral_code?: string | null;
    status?: string | null;
    user_status?: string | null;
    is_inactive?: boolean;
    master_affiliate?: NetworkPerson | null;
    partner?: NetworkPerson | null;
    invited_agents_count: number;
    subscribed_agents_count: number;
    created_at?: string | null;
};

type PageProps = {
    data: {
        data: AffiliateRow[];
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

export default function Page({ data }: PageProps) {
    const columns = useMemo<ColumnDef<AffiliateRow>[]>(
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
                id: 'affiliate',
                accessorKey: 'name',
                header: ({
                    column,
                }: {
                    column: Column<AffiliateRow, unknown>;
                }) => (
                    <DataTableColumnHeader column={column} label="Affiliate" />
                ),
                cell: ({ row }) => (
                    <div className="min-w-[210px] space-y-1">
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
                    label: 'Affiliate',
                    placeholder: 'Search affiliate...',
                    variant: 'text',
                    icon: Text,
                },
                enableColumnFilter: true,
            },
            {
                id: 'master_affiliate',
                accessorFn: (row) => row.master_affiliate?.name || '',
                header: ({
                    column,
                }: {
                    column: Column<AffiliateRow, unknown>;
                }) => <DataTableColumnHeader column={column} label="MA" />,
                cell: ({ row }) => (
                    <PersonCell person={row.original.master_affiliate} />
                ),
            },
            {
                id: 'partner',
                accessorFn: (row) => row.partner?.name || '',
                header: ({
                    column,
                }: {
                    column: Column<AffiliateRow, unknown>;
                }) => <DataTableColumnHeader column={column} label="Partner" />,
                cell: ({ row }) => <PersonCell person={row.original.partner} />,
            },
            {
                id: 'invited_agents_count',
                accessorKey: 'invited_agents_count',
                header: ({
                    column,
                }: {
                    column: Column<AffiliateRow, unknown>;
                }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Invited Agents"
                    />
                ),
                cell: ({ cell }) => (
                    <div className="min-w-[110px] text-sm font-medium">
                        {cell.getValue<number>()}
                    </div>
                ),
            },
            {
                id: 'subscribed_agents_count',
                accessorKey: 'subscribed_agents_count',
                header: ({
                    column,
                }: {
                    column: Column<AffiliateRow, unknown>;
                }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Subscribed Agents"
                    />
                ),
                cell: ({ cell }) => (
                    <div className="min-w-[130px] text-sm font-medium text-emerald-700">
                        {cell.getValue<number>()}
                    </div>
                ),
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: ({
                    column,
                }: {
                    column: Column<AffiliateRow, unknown>;
                }) => <DataTableColumnHeader column={column} label="Status" />,
                cell: ({ row }) => <StatusBadge status={row.original.status} />,
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({
                    column,
                }: {
                    column: Column<AffiliateRow, unknown>;
                }) => (
                    <DataTableColumnHeader column={column} label="Join Date" />
                ),
                cell: ({ cell }) => {
                    const createdAt = cell.getValue<string | null>();

                    return (
                        <div className="min-w-[110px] text-sm text-slate-700 dark:text-slate-300">
                            {createdAt ? dayjs(createdAt).format('DD MMM YYYY') : '-'}
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
            breadcrumb={[{ title: 'Database' }, { title: 'Affiliate' }]}
        >
            <DataTable
                table={table}
                renderEmptyState={
                    <div className="py-8 text-sm text-slate-500">
                        No affiliates found.
                    </div>
                }
            >
                <DataTableToolbar table={table} searchMode="global" />
            </DataTable>
        </AdminDashboardLayout>
    );
}
