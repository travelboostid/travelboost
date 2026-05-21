import { adminSearchResourceOwners } from '@/api/misc/misc';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import { extractImageSrc } from '@/lib/utils';
import type { Option } from '@/types/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { CalendarIcon, CircleDashedIcon, TextIcon } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyProducts } from './components/empty-products';

const STATUS_OPTIONS = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
];

type TourProductsPageProps = {
    data: {
        data: any[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};

export default function TourProductsPage({ data }: TourProductsPageProps) {
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
                enableSorting: false,
                enableHiding: false,
            },
            {
                id: 'code',
                accessorKey: 'code',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Code" />
                ),
                cell: ({ row }) => (
                    <div className="font-mono text-xs">
                        {row.getValue('code')}
                    </div>
                ),
                meta: {
                    label: 'Code',
                    placeholder: 'Search codes...',
                    variant: 'text',
                    icon: TextIcon,
                },
                enableSorting: true,
                enableColumnFilter: true,
            },
            {
                id: 'name',
                accessorKey: 'name',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Name" />
                ),
                cell: ({ row }) => (
                    <div className="max-w-48 truncate font-medium">
                        {row.getValue('name')}
                    </div>
                ),
                meta: {
                    label: 'Name',
                    placeholder: 'Search names...',
                    variant: 'text',
                    icon: TextIcon,
                },
                enableSorting: true,
                enableColumnFilter: true,
            },
            {
                id: 'company',
                accessorKey: 'company',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Vendor" />
                ),
                cell: ({ row }) => (
                    <div>{row.original.company?.name ?? '-'}</div>
                ),
                meta: {
                    label: 'Vendor',
                    variant: 'multiSelect',
                    options: async (query, currentValues) => {
                        const response = await adminSearchResourceOwners({
                            types: 'company',
                            keyword: query,
                            include_ids: Array.from(currentValues)
                                .map((v) => `company:${v}`)
                                .join(','),
                        } as any);

                        const companies = response.data.companies as any[];
                        return companies.map(
                            (company) =>
                                ({
                                    label: company.name,
                                    value: company.id.toString(),
                                }) as Option,
                        );
                    },
                    icon: CircleDashedIcon,
                },
                enableSorting: false,
                enableColumnFilter: true,
            },
            {
                id: 'category',
                accessorFn: (row) => row.category?.name ?? '-',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Category" />
                ),
                cell: ({ row }) => (
                    <div>{row.original.category?.name ?? '-'}</div>
                ),
                enableSorting: false,
            },
            {
                id: 'destination',
                accessorFn: (row) => row.destination,
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Destination"
                    />
                ),
                cell: ({ row }) => (
                    <div className="max-w-32 truncate">
                        {row.original.destination}
                    </div>
                ),
                enableSorting: false,
            },
            {
                header: 'Image',
                cell: ({ row }) => {
                    const { src } = extractImageSrc(row.original.image as any);
                    return (
                        <div>
                            <img
                                src={src}
                                className="aspect-video w-16 rounded object-cover"
                                alt={row.original.name}
                            />
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
                cell: ({ row }) => {
                    const status = row.getValue<string>('status');
                    return (
                        <Badge
                            variant={
                                status === 'active' ? 'default' : 'secondary'
                            }
                        >
                            {status}
                        </Badge>
                    );
                },
                meta: {
                    label: 'Status',
                    placeholder: 'Search status...',
                    variant: 'multiSelect',
                    options: STATUS_OPTIONS,
                    icon: CircleDashedIcon,
                },
                enableSorting: true,
                enableColumnFilter: true,
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Created at" />
                ),
                cell: ({ row }) => (
                    <div className="text-muted-foreground">
                        {dayjs(row.getValue('created_at')).fromNow()}
                    </div>
                ),
                meta: {
                    label: 'Created date',
                    placeholder: 'Search created date...',
                    variant: 'dateRange',
                    icon: CalendarIcon,
                },
                enableSorting: true,
                enableColumnFilter: true,
            },
            {
                id: 'actions',
                enableHiding: false,
                cell: ({ row }) => <div></div>,
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
            activeMenuIds={['tours', 'tours.products']}
            openMenuIds={['tours']}
            breadcrumb={[{ title: 'Tours' }, { title: 'Products' }]}
        >
            <DataTable table={table} renderEmptyState={<EmptyProducts />}>
                <DataTableToolbar table={table} />
            </DataTable>
        </AdminDashboardLayout>
    );
}
