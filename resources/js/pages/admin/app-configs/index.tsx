import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { useDataTable } from '@/hooks/use-data-table';
import type { Column, ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useMemo } from 'react';
import CreateButton from './components/create-button';
import DeleteButton from './components/delete-button';
import EditButton from './components/edit-button';
dayjs.extend(relativeTime);

type AppConfigResource = {
    id: number;
    key: string;
    description: string;
    value: any;
    schema: any;
    created_at: string;
    updated_at: string;
};

type AppConfigsPageProps = {
    data: AppConfigResource[];
};

export default function AppConfigsPage({ data }: AppConfigsPageProps) {
    const columns = useMemo<ColumnDef<AppConfigResource>[]>(
        () => [
            {
                id: 'key',
                accessorKey: 'key',
                header: ({
                    column,
                }: {
                    column: Column<AppConfigResource, unknown>;
                }) => <DataTableColumnHeader column={column} label="Key" />,
                cell: ({ cell }) => (
                    <div>{cell.getValue<AppConfigResource['key']>()}</div>
                ),
            },
            {
                id: 'description',
                accessorKey: 'description',
                header: ({
                    column,
                }: {
                    column: Column<AppConfigResource, unknown>;
                }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Description"
                    />
                ),
                cell: ({ cell }) => (
                    <div>
                        {cell.getValue<AppConfigResource['description']>()}
                    </div>
                ),
            },
            {
                id: 'updated_at',
                accessorKey: 'updated_at',
                header: ({
                    column,
                }: {
                    column: Column<AppConfigResource, unknown>;
                }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Last Updated"
                    />
                ),
                cell: ({ cell }) => (
                    <div>
                        {cell.getValue<AppConfigResource['updated_at']>()}
                    </div>
                ),
            },
            {
                id: 'actions',
                cell: ({ cell }) => {
                    return (
                        <div className="flex gap-2">
                            <EditButton data={cell.row.original} />
                            <DeleteButton data={cell.row.original} />
                        </div>
                    );
                },
                size: 32,
            },
        ],
        [],
    );

    const { table } = useDataTable({
        data: data,
        columns,
        pageCount: 1,
        rowCount: data.length,
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
            activeMenuIds={['app-configs']}
            breadcrumb={[{ title: 'App Configs' }]}
            applet={<CreateButton />}
        >
            <DataTable table={table}>
                <DataTableToolbar table={table} />
            </DataTable>
        </AdminDashboardLayout>
    );
}
