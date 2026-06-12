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
import { Head } from '@inertiajs/react';
import { ChevronDown, EditIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import AddPriceCategoryDialog from './add-price-category-dialog';
import UpdatePriceCategoryDialog from './update-price-category-dialog';

type PriceCategory = {
    id: number;
    name: string;
    room_type: string;
    description: string;
};

function RowAction({ item }: { item: PriceCategory }) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();

    const handleDelete = () => {
        if (
            !confirm(
                intl.formatMessage({
                    defaultMessage: 'Delete this category?',
                }),
            )
        ) {
            return;
        }

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

export default function Page({ categories }: any) {
    const intl = useIntl();
    const [sorting, setSorting] = React.useState([]);
    const [columnFilters, setColumnFilters] = React.useState([]);
    const [columnVisibility, setColumnVisibility] = React.useState({});
    const [rowSelection, setRowSelection] = React.useState({});

    const columns = React.useMemo<ColumnDef<PriceCategory>[]>(
        () => [
            {
                accessorKey: 'name',
                header: () => <FormattedMessage defaultMessage="Name" />,
                cell: ({ row }) => <div>{row.getValue('name')}</div>,
            },
            {
                accessorKey: 'room_type',
                header: () => <FormattedMessage defaultMessage="Room Type" />,
                cell: ({ row }) => <div>{row.getValue('room_type')}</div>,
            },
            {
                accessorKey: 'description',
                header: () => <FormattedMessage defaultMessage="Description" />,
                cell: ({ row }) => <div>{row.getValue('description')}</div>,
            },
            {
                id: 'actions',
                cell: ({ row }) => <RowAction item={row.original} />,
            },
        ],
        [],
    );

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
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Tours',
                    }),
                },
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Price Categories',
                    }),
                },
            ]}
            openMenuIds={['tours']}
            activeMenuIds={['tours.price-categories']}
            applet={
                <AddPriceCategoryDialog>
                    <Button>
                        <PlusIcon />
                        <FormattedMessage defaultMessage="Add Price Category" />
                    </Button>
                </AddPriceCategoryDialog>
            }
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Price Categories',
                })}
            />

            <div className="w-full p-4">
                <div className="flex items-center py-4">
                    <Input
                        placeholder={intl.formatMessage({
                            defaultMessage: 'Filter name...',
                        })}
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
                                <FormattedMessage defaultMessage="Columns" />
                                <ChevronDown />
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
                                        <FormattedMessage defaultMessage="No results" />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end gap-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <FormattedMessage defaultMessage="Previous" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <FormattedMessage defaultMessage="Next" />
                    </Button>
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
