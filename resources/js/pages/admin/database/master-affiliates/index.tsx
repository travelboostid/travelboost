import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { Ban, CalendarIcon, CircleDashedIcon, Text } from 'lucide-react';
import { useMemo } from 'react';
import {
    AffiliateStatusBadge,
    MasterAffiliateRowActions,
} from '../shared/affiliate-row-actions';
import type {
    AdminMasterAffiliateRow,
    NetworkPerson,
    PaginatedMasterAffiliates,
} from '../shared/affiliate-types';
import { AffiliatesTableActionBar } from '../shared/affiliates-table-action-bar';

const STATUS_OPTIONS = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Suspended', value: 'suspended' },
];

function InactiveIcon({ person }: { person?: NetworkPerson | null }) {
    if (!person?.is_inactive) {
        return null;
    }

    return <Ban className="size-3.5 text-rose-500" aria-hidden="true" />;
}

function PersonName({ person }: { person?: NetworkPerson | null }) {
    if (!person) {
        return <span className="text-sm text-muted-foreground">—</span>;
    }

    return (
        <div className="flex min-w-[120px] items-center gap-2">
            <span className="truncate text-sm font-medium">
                {person.name || '—'}
            </span>
            <InactiveIcon person={person} />
        </div>
    );
}

type PageProps = {
    data: PaginatedMasterAffiliates;
};

export default function Page({ data }: PageProps) {
    const columns = useMemo<ColumnDef<AdminMasterAffiliateRow>[]>(
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
                id: 'name',
                accessorKey: 'name',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Master Affiliate"
                    />
                ),
                cell: ({ row }) => (
                    <div className="min-w-[220px] space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">
                                {row.original.name || '—'}
                            </span>
                            {row.original.is_inactive ? (
                                <Ban
                                    className="size-3.5 text-rose-500"
                                    aria-hidden="true"
                                />
                            ) : null}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                            {row.original.email || '—'}
                        </div>
                        {row.original.referral_code ? (
                            <Badge
                                variant="outline"
                                className="font-mono text-[11px]"
                            >
                                {row.original.referral_code}
                            </Badge>
                        ) : null}
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
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Partner" />
                ),
                cell: ({ row }) => <PersonName person={row.original.partner} />,
                enableSorting: false,
            },
            {
                id: 'invited_affiliates_count',
                accessorKey: 'invited_affiliates_count',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Invited Affiliates"
                    />
                ),
                cell: ({ cell }) => (
                    <div className="min-w-[110px] text-sm font-medium">
                        {cell.getValue<number>()}
                    </div>
                ),
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Status" />
                ),
                cell: ({ row }) => (
                    <AffiliateStatusBadge status={row.original.status} />
                ),
                meta: {
                    label: 'Status',
                    variant: 'multiSelect',
                    options: STATUS_OPTIONS,
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Join Date" />
                ),
                cell: ({ cell }) => {
                    const createdAt = cell.getValue<string | null>();

                    return (
                        <div className="text-sm">
                            {createdAt
                                ? dayjs(createdAt).format('DD MMM YYYY')
                                : '—'}
                        </div>
                    );
                },
                meta: {
                    label: 'Join Date',
                    placeholder: 'Search join date...',
                    variant: 'dateRange',
                    icon: CalendarIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'actions',
                cell: ({ row }) => (
                    <MasterAffiliateRowActions masterAffiliate={row.original} />
                ),
                size: 40,
            },
        ],
        [],
    );

    const { table } = useDataTable({
        queryKeys: {
            perPage: 'per_page',
            page: 'page',
        },
        data: data.data,
        columns,
        pageCount: data.last_page,
        rowCount: data.total,
        shallow: false,
        initialState: {
            sorting: [{ id: 'created_at', desc: true }],
            columnPinning: { right: ['actions'] },
        },
        getRowId: (row) => row.id.toString(),
    });

    return (
        <AdminDashboardLayout
            containerClassName="p-4"
            activeMenuIds={['database', 'database.master-affiliates']}
            openMenuIds={['database']}
            breadcrumb={[{ title: 'Database' }, { title: 'Master Affiliate' }]}
        >
            <DataTable
                table={table}
                renderEmptyState={
                    <div className="py-8 text-sm text-muted-foreground">
                        No master affiliates found.
                    </div>
                }
                actionBar={
                    <AffiliatesTableActionBar
                        table={table}
                        entity="master-affiliate"
                    />
                }
            >
                <DataTableToolbar table={table} />
            </DataTable>
        </AdminDashboardLayout>
    );
}
