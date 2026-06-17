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
import { EmptyWallets } from './components/empty-wallets';

type WalletsPageProps = {
    data: {
        data: any[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};

export default function WalletsPage({ data }: WalletsPageProps) {
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
                cell: ({ row: _row }) => (
                    <Checkbox
                        checked={_row.getIsSelected()}
                        onCheckedChange={(value) =>
                            _row.toggleSelected(!!value)
                        }
                        aria-label="Select row"
                    />
                ),
                size: 32,
                enableSorting: true,
                enableHiding: false,
            },
            {
                id: 'holder',
                accessorKey: 'holder',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Holder" />
                ),
                cell: ({ row: _row }) => (
                    <div>{_row.original.holder?.name ?? '-'}</div>
                ),
                meta: {
                    label: 'Holder',
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
                id: 'name',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Name" />
                ),
                cell: ({ row: _row }) => (
                    <div>
                        <div>
                            {_row.original.name ?? '-'} (
                            {_row.original.slug ?? '-'})
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {_row.original.description ?? '-'}
                        </div>
                    </div>
                ),
            },
            {
                id: 'balance',
                accessorKey: 'balance',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Balance" />
                ),
                cell: ({ cell }) => {
                    const balance = cell.getValue<any>();
                    return <div>{formatIDR(balance)}</div>;
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
                            {dayjs(createdAt).format('DD MMM YYYY')}
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
                cell: ({ row: _row }) => {
                    return <div className="flex gap-2">actions</div>;
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
        getRowId: (_row) => row.id.toString(),
    });

    return (
        <AdminDashboardLayout
            containerClassName="p-4"
            activeMenuIds={['funds', 'funds.wallets']}
            openMenuIds={['funds']}
            breadcrumb={[{ title: 'Funds' }, { title: 'Wallets' }]}
        >
            <DataTable table={table} renderEmptyState={<EmptyWallets />}>
                <DataTableToolbar table={table} />
            </DataTable>
        </AdminDashboardLayout>
    );
}
