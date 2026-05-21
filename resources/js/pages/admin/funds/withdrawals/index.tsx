import { adminSearchResourceOwners } from '@/api/misc/misc';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import { formatIDR } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { CalendarIcon, CircleDashedIcon } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyWithdrawals } from './components/empty-withdrawals';
import MarkAsPaidButton from './components/mark-as-paid-button';
import ProcessButton from './components/process-button';
import RejectButton from './components/reject-button';

const STATUS_OPTIONS = [
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Paid', value: 'paid' },
];

const METHOD_OPTIONS = [
    { label: 'Auto', value: 'auto' },
    { label: 'Manual Transfer', value: 'manual' },
];

type WithdrawalsPageProps = {
    data: {
        data: any[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};

export default function WithdrawalsPage({ data }: WithdrawalsPageProps) {
    const columns = useMemo<ColumnDef<any>[]>(
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
                enableSorting: true,
                enableHiding: false,
            },

            {
                id: 'owner',
                accessorKey: 'owner',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Requester" />
                ),
                cell: ({ row }) => <div>{row.original.owner?.name ?? '-'}</div>,
                meta: {
                    label: 'Requester',
                    variant: 'multiSelect',
                    options: async (query, currentValues) => {
                        const response = await adminSearchResourceOwners({
                            types: 'company,user',
                            keyword: query,
                            include_ids: Array.from(currentValues).join(','),
                        } as any);

                        const companies = response.data.companies as any[];
                        const users = response.data.users as any[];
                        const companyOptions = companies.map((c) => ({
                            label: c.name,
                            value: `company:${c.id}`,
                        }));
                        const userOptions = users.map((c) => ({
                            label: c.name,
                            value: `user:${c.id}`,
                        }));
                        return [...companyOptions, ...userOptions];
                    },
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
                enableSorting: false,
            },
            {
                id: 'wallet',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Wallet" />
                ),
                cell: ({ row }) => (
                    <div>{row.original.wallet?.name ?? '-'}</div>
                ),
            },
            {
                id: 'method',
                accessorKey: 'method',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Method" />
                ),
                cell: ({ cell }) => <div>{cell.getValue<any>()}</div>,
                meta: {
                    label: 'Method',
                    placeholder: 'Search method...',
                    variant: 'multiSelect',
                    options: METHOD_OPTIONS,
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Status" />
                ),
                cell: ({ cell }) => <div>{cell.getValue<any>()}</div>,
                meta: {
                    label: 'Status',
                    placeholder: 'Search status...',
                    variant: 'multiSelect',
                    options: STATUS_OPTIONS,
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'amount',
                accessorKey: 'amount',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Amount" />
                ),
                cell: ({ cell }) => {
                    const amount = cell.getValue<any>();
                    return <div>{formatIDR(amount)}</div>;
                },
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Created Date"
                    />
                ),
                cell: ({ cell }) => {
                    const createdAt = cell.getValue<any>();

                    return (
                        <div className="flex items-center gap-1">
                            {dayjs(createdAt).fromNow()}
                        </div>
                    );
                },
                meta: {
                    label: 'Created date',
                    placeholder: 'Search created date...',
                    variant: 'dateRange',
                    icon: CalendarIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    return (
                        <div className="flex gap-2">
                            {row.original.status === 'pending' && (
                                <ProcessButton data={row.original} />
                            )}
                            {row.original.status === 'processing' && (
                                <MarkAsPaidButton data={row.original} />
                            )}
                            {row.original.status === 'pending' && (
                                <RejectButton data={row.original} />
                            )}
                        </div>
                    );
                },
                size: 32,
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
            activeMenuIds={['funds', 'funds.withdrawals']}
            openMenuIds={['funds']}
            breadcrumb={[{ title: 'Funds' }, { title: 'Withdrawals' }]}
        >
            <DataTable table={table} renderEmptyState={<EmptyWithdrawals />}>
                <DataTableToolbar table={table} />
            </DataTable>
        </AdminDashboardLayout>
    );
}
