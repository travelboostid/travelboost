import { adminSearchResourceOwners } from '@/api/misc/misc';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import { router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { CalendarIcon, CircleDashedIcon, TextIcon } from 'lucide-react';
import { useMemo } from 'react';
import { AddMediaButton } from './components/add-media-button';
import DeleteButton from './components/delete-button';
import { EmptyMedias } from './components/empty-medias';

const TYPE_OPTIONS = [
    { label: 'Image', value: 'image' },
    { label: 'Document', value: 'document' },
    { label: 'RAW', value: 'raw' },
];

const SUBTYPE_OPTIONS = [
    { label: 'Tour Image', value: 'tour-image' },
    { label: 'Photo', value: 'photo' },
    { label: 'Tour Document', value: 'tour-document' },
    { label: 'Identity Card', value: 'identity-card' },
    { label: 'Other', value: 'other' },
];

type MediasPageProps = {
    data: {
        data: any[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};

export default function MediasPage({ data }: MediasPageProps) {
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
                    <DataTableColumnHeader column={column} label="Owner" />
                ),
                cell: ({ row }) => <div>{row.original.owner?.name ?? '-'}</div>,
                meta: {
                    label: 'Owner',
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
                accessorKey: 'name',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Name" />
                ),
                cell: ({ cell }) => <div>{cell.getValue<any>()}</div>,
                meta: {
                    label: 'Name',
                    placeholder: 'Search names...',
                    variant: 'text',
                    icon: TextIcon,
                },
                enableColumnFilter: true,
                enableSorting: true,
            },
            {
                id: 'type',
                accessorKey: 'type',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Type" />
                ),
                cell: ({ cell }) => <div>{cell.getValue<any>()}</div>,
                meta: {
                    label: 'Type',
                    variant: 'multiSelect',
                    options: TYPE_OPTIONS,
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
                enableSorting: true,
            },
            {
                id: 'subtype',
                accessorKey: 'subtype',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Subtype" />
                ),
                cell: ({ cell }) => <div>{cell.getValue<any>()}</div>,
                meta: {
                    label: 'Subtype',
                    variant: 'multiSelect',
                    options: SUBTYPE_OPTIONS,
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
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
            {
                id: 'actions',
                cell: ({ row }) => {
                    return (
                        <div className="flex gap-1">
                            <DeleteButton data={row.original} />
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
            activeMenuIds={['database', 'database.medias']}
            openMenuIds={['database']}
            breadcrumb={[{ title: 'Database' }, { title: 'Media' }]}
            applet={<AddMediaButton afterUpload={() => router.reload()} />}
        >
            <DataTable table={table} renderEmptyState={<EmptyMedias />}>
                <DataTableToolbar table={table} />
            </DataTable>
        </AdminDashboardLayout>
    );
}
