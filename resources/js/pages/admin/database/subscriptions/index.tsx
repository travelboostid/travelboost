import { adminSearchResourceOwners } from '@/api/misc/misc';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import { formatIDR } from '@/lib/utils';
import { SubscriptionStatusBadge } from '@/pages/admin/database/shared/company-row-actions';
import { edit } from '@/routes/admin/database/agents';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { CalendarIcon, CircleDashedIcon } from 'lucide-react';
import { useMemo } from 'react';
import { EmptySubscriptions } from './components/empty-subscriptions';

const STATUS_OPTIONS = [
    { label: 'Active', value: 'active' },
    { label: 'Expired', value: 'expired' },
    { label: 'Inactive', value: 'inactive' },
];

type AdminSubscriptionRow = {
    id: number;
    status: string;
    started_at: string | null;
    ended_at: string | null;
    created_at: string | null;
    company: {
        id: number;
        name: string;
        username: string;
    } | null;
    package: {
        id: number;
        name: string;
        price: string | number;
        duration_months: number;
    } | null;
};

type SubscriptionsPageProps = {
    data: {
        data: AdminSubscriptionRow[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};

export default function SubscriptionsPage({ data }: SubscriptionsPageProps) {
    const columns = useMemo<ColumnDef<AdminSubscriptionRow>[]>(
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
                id: 'company',
                accessorKey: 'company',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Agent" />
                ),
                cell: ({ row }) => {
                    const company = row.original.company;

                    if (!company) {
                        return (
                            <span className="text-sm text-muted-foreground">
                                —
                            </span>
                        );
                    }

                    return (
                        <div className="min-w-[160px]">
                            <div className="font-medium">{company.name}</div>
                            <div className="text-xs text-muted-foreground">
                                @{company.username}
                            </div>
                        </div>
                    );
                },
                meta: {
                    label: 'Agent',
                    variant: 'multiSelect',
                    options: async (query, currentValues) => {
                        const response = await adminSearchResourceOwners({
                            types: 'company',
                            keyword: query,
                            include_ids: Array.from(currentValues)
                                .map((id) => `company:${id}`)
                                .join(','),
                        } as any);

                        const companies = response.data.companies as any[];

                        return companies.map((company) => ({
                            label: company.name,
                            value: company.id.toString(),
                        }));
                    },
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
                enableSorting: false,
            },
            {
                id: 'package',
                accessorFn: (row) => row.package?.name ?? '',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Package" />
                ),
                cell: ({ row }) => {
                    const pkg = row.original.package;

                    if (!pkg) {
                        return (
                            <span className="text-sm text-muted-foreground">
                                —
                            </span>
                        );
                    }

                    return (
                        <div className="min-w-[140px]">
                            <div className="text-sm font-medium">
                                {pkg.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {pkg.duration_months} month
                                {pkg.duration_months === 1 ? '' : 's'}
                            </div>
                        </div>
                    );
                },
                enableSorting: false,
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Status" />
                ),
                cell: ({ row }) => (
                    <SubscriptionStatusBadge status={row.original.status} />
                ),
                meta: {
                    label: 'Status',
                    variant: 'multiSelect',
                    options: STATUS_OPTIONS,
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
                enableSorting: false,
            },
            {
                id: 'price',
                accessorFn: (row) => row.package?.price ?? 0,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Price" />
                ),
                cell: ({ row }) => {
                    const price = row.original.package?.price;

                    if (price === undefined || price === null) {
                        return (
                            <span className="text-sm text-muted-foreground">
                                —
                            </span>
                        );
                    }

                    return <div className="text-sm">{formatIDR(price)}</div>;
                },
                enableSorting: false,
            },
            {
                id: 'started_at',
                accessorKey: 'started_at',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Started" />
                ),
                cell: ({ cell }) => {
                    const startedAt = cell.getValue<string | null>();

                    return (
                        <div className="text-sm">
                            {startedAt
                                ? dayjs(startedAt).format('DD MMM YYYY')
                                : '—'}
                        </div>
                    );
                },
                meta: {
                    label: 'Started',
                    placeholder: 'Filter start date...',
                    variant: 'dateRange',
                    icon: CalendarIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'ended_at',
                accessorKey: 'ended_at',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Ends" />
                ),
                cell: ({ cell }) => {
                    const endedAt = cell.getValue<string | null>();

                    return (
                        <div className="text-sm">
                            {endedAt
                                ? dayjs(endedAt).format('DD MMM YYYY')
                                : '—'}
                        </div>
                    );
                },
                meta: {
                    label: 'Ends',
                    placeholder: 'Filter end date...',
                    variant: 'dateRange',
                    icon: CalendarIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    const companyId = row.original.company?.id;

                    if (!companyId) {
                        return null;
                    }

                    return (
                        <Button variant="ghost" size="sm" asChild>
                            <a href={edit({ agent: companyId }).url}>
                                View agent
                            </a>
                        </Button>
                    );
                },
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
            sorting: [{ id: 'id', desc: true }],
            columnPinning: { right: ['actions'] },
        },
        getRowId: (row) => row.id.toString(),
    });

    return (
        <AdminDashboardLayout
            containerClassName="p-4"
            activeMenuIds={['database', 'database.subscriptions']}
            openMenuIds={['database']}
            breadcrumb={[{ title: 'Database' }, { title: 'Subscriptions' }]}
        >
            <DataTable table={table} renderEmptyState={<EmptySubscriptions />}>
                <DataTableToolbar table={table} />
            </DataTable>
        </AdminDashboardLayout>
    );
}
