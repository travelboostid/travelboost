import type { UserResource } from '@/api/model';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import type { Column, ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { CalendarIcon } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyKnowledgeBases } from './components/empty-knowledge-bases';

const _STATUS_OPTIONS = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Suspended', value: 'suspended' },
];

type KnowledgeBasePageProps = {
    data: {
        data: any[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};

export default function KnowledgeBasePage({ data }: KnowledgeBasePageProps) {
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
                enableSorting: false,
                enableHiding: false,
            },
            {
                id: 'content',
                accessorKey: 'content',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Content" />
                ),
                cell: ({ cell }) => (
                    <div className="max-w-200 truncate">
                        {cell.getValue<string>()}
                    </div>
                ),
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({
                    column,
                }: {
                    column: Column<UserResource, unknown>;
                }) => (
                    <DataTableColumnHeader column={column} label="Created at" />
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
                    label: 'Created Date',
                    placeholder: 'Search created date...',
                    variant: 'dateRange',
                    icon: CalendarIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'actions',
                cell: ({ row: _row }) => {
                    return <div></div>;
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
            activeMenuIds={['database', 'database.knowledge-bases']}
            openMenuIds={['database']}
            breadcrumb={[{ title: 'Database' }, { title: 'Knowledge Bases' }]}
        >
            <DataTable table={table} renderEmptyState={<EmptyKnowledgeBases />}>
                <DataTableToolbar table={table} />
            </DataTable>
        </AdminDashboardLayout>
    );
}
