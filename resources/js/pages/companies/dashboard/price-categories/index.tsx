import { router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';

import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { ChevronDown, EditIcon, PlusIcon, TrashIcon } from 'lucide-react';

import AddPriceCategoryDialog from './add-price-category-dialog';
import UpdatePriceCategoryDialog from './update-price-category-dialog';

type PriceCategory = {
    id: number;
    name: string;
    room_type: string;
    description: string;
};

function RowAction({ item }: { item: PriceCategory }) {
    const { company } = usePageSharedDataProps();

    const handleDelete = () => {
        if (!confirm('Delete this category?')) return;

        router.delete(
            `/companies/${company.username}/dashboard/price-categories/${item.id}`,
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <div className="flex gap-2">
            <Button variant="destructive" onClick={handleDelete}>
                <TrashIcon />
            </Button>

            <UpdatePriceCategoryDialog item={item}>
                <Button>
                    <EditIcon />
                </Button>
            </UpdatePriceCategoryDialog>
        </div>
    );
}

export const columns: ColumnDef<PriceCategory>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <div>{row.getValue('name')}</div>,
    },
    {
        accessorKey: 'room_type',
        header: 'Room Type',
        cell: ({ row }) => <div>{row.getValue('room_type')}</div>,
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => <div>{row.getValue('description')}</div>,
    },
    {
        id: 'actions',
        cell: ({ row }) => <RowAction item={row.original} />,
    },
];

export default function Page({ categories }: any) {
    const [sorting, setSorting] = React.useState([]);
    const [columnFilters, setColumnFilters] = React.useState([]);
    const [columnVisibility, setColumnVisibility] = React.useState({});
    const [rowSelection, setRowSelection] = React.useState({});

    const table = useReactTable({
        data: categories,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),

        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,

        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    return (
        <CompanyDashboardLayout
            breadcrumb={[{ title: 'Tours' }, { title: 'Price Categories' }]}
            openMenuIds={['tours']}
            activeMenuIds={['tours.price-categories']}
            applet={
                <AddPriceCategoryDialog>
                    <Button>
                        <PlusIcon /> Add Price Category
                    </Button>
                </AddPriceCategoryDialog>
            }
        >
            <div className="w-full p-4">
                {/* FILTER */}
                <div className="flex items-center py-4">
                    <Input
                        placeholder="Filter name..."
                        value={
                            (table
                                .getColumn('name')
                                ?.getFilterValue() as string) ?? ''
                        }
                        onChange={(e) =>
                            table
                                .getColumn('name')
                                ?.setFilterValue(e.target.value)
                        }
                        className="max-w-sm"
                    />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                Columns <ChevronDown />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                                {table
                                    .getAllColumns()
                                    .filter((col) => col.getCanHide())
                                    .map((col) => (
                                        <DropdownMenuCheckboxItem
                                            key={col.id}
                                            checked={col.getIsVisible()}
                                            onCheckedChange={(val) =>
                                                col.toggleVisibility(!!val)
                                            }
                                        >
                                            {col.id}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* TABLE */}
                <div className="overflow-hidden rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((hg) => (
                                <TableRow key={hg.id}>
                                    {hg.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>

                        <TableBody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="text-center"
                                    >
                                        No results
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* PAGINATION */}
                <div className="flex justify-end gap-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
