import { adminSearchResourceOwners } from '@/api/misc/misc';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { CalendarIcon, CircleDashedIcon } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyLogs } from './components/empty-logs';
import Summary from './components/summary';

export type AiUsageLogsPageProps = {
    data: {
        data: any[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
    summary: {
        total_user_cost: number;
        total_usage_cost: number;
        total_profit: number;
    };
};

export default function AiUsageLogsPage({ data }: AiUsageLogsPageProps) {
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
                id: 'company',
                accessorKey: 'company',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Company" />
                ),
                cell: ({ row }) => (
                    <div>{row.original.company?.name ?? '-'}</div>
                ),
                meta: {
                    label: 'Company',
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

                        const companyOptions = companies.map((c) => ({
                            label: c.name,
                            value: c.id,
                        }));
                        return companyOptions;
                    },
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
                enableSorting: false,
            },

            {
                id: 'embedding_tokens',
                accessorKey: 'embedding_tokens',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Embedding Tokens"
                    />
                ),
                cell: ({ cell }) => <div>{cell.getValue<any>()}</div>,
                enableSorting: true,
            },
            {
                id: 'prompt_tokens',
                accessorKey: 'prompt_tokens',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Prompt Tokens"
                    />
                ),
                cell: ({ cell }) => (
                    <div className="text-right">
                        {cell.getValue<number>() || 0}
                    </div>
                ),
                enableSorting: true,
            },
            {
                id: 'completion_tokens',
                accessorKey: 'completion_tokens',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Completion Tokens"
                    />
                ),
                cell: ({ cell }) => (
                    <div className="text-right">
                        {cell.getValue<number>() || 0}
                    </div>
                ),
                enableSorting: true,
            },
            {
                id: 'usage_cost',
                accessorKey: 'usage_cost',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Usage Cost" />
                ),
                cell: ({ cell }) => (
                    <div className="text-right">{cell.getValue<any>()}</div>
                ),
                enableSorting: true,
            },
            {
                id: 'user_cost',
                accessorKey: 'user_cost',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="User Cost" />
                ),
                cell: ({ cell }) => (
                    <div className="text-right">{cell.getValue<any>()}</div>
                ),
                enableSorting: true,
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Created at" />
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
                    label: 'Created Date',
                    placeholder: 'Search created date...',
                    variant: 'dateRange',
                    icon: CalendarIcon,
                },
                enableColumnFilter: true,
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
            activeMenuIds={['database', 'database.ai-usage-logs']}
            openMenuIds={['database']}
            breadcrumb={[{ title: 'Database' }, { title: 'AI Usage Logs' }]}
        >
            <DataTable table={table} renderEmptyState={<EmptyLogs />}>
                <DataTableToolbar table={table} />
                <Summary />
            </DataTable>
        </AdminDashboardLayout>
    );
}
