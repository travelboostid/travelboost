import { destroy } from '@/actions/App/Http/Controllers/Companies/Dashboard/CategoryController';
import type { TourCategoryResource } from '@/api/model';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Head, router, usePage } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table';
import { ChevronDown, EditIcon, PlusIcon, TrashIcon } from 'lucide-react';
import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import AddCategoryDialog from './add-category-dialog';
import UpdateCategoryDialog from './update-category-dialog';

function RowAction({ category }: { category: TourCategoryResource }) {
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
            destroy({ company: company.username, category: category.id }),
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
            <UpdateCategoryDialog category={category}>
                <Button>
                    <EditIcon />
                </Button>
            </UpdateCategoryDialog>
        </div>
    );
}

export default function Page({ data }: { data: any }) {
    const intl = useIntl();
    const { errors } = usePage().props as any;
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const columns = React.useMemo<ColumnDef<TourCategoryResource>[]>(
        () => [
            {
                accessorKey: 'name',
                header: () => <FormattedMessage defaultMessage="Name" />,
                cell: ({ row }) => (
                    <div className="">{row.getValue('name')}</div>
                ),
            },
            {
                accessorKey: 'description',
                header: () => <FormattedMessage defaultMessage="Description" />,
                cell: ({ row }) => (
                    <div className="">{row.getValue('description')}</div>
                ),
            },
            {
                accessorKey: 'position_no',
                header: () => <FormattedMessage defaultMessage="Position No" />,
                cell: ({ row }) => (
                    <div className="">{row.getValue('position_no')}</div>
                ),
            },
            {
                id: 'actions',
                enableHiding: false,
                cell: ({ row }) => <RowAction category={row.original} />,
            },
        ],
        [],
    );

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
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
                        defaultMessage: 'Product Categories',
                    }),
                },
            ]}
            openMenuIds={['tours']}
            activeMenuIds={['tours.categories']}
            applet={
                <AddCategoryDialog>
                    <Button>
                        <PlusIcon />
                        <FormattedMessage defaultMessage="Add Category" />
                    </Button>
                </AddCategoryDialog>
            }
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Product Categories',
                })}
            />

            <div className="w-full p-4">
                {errors.delete_error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errors.delete_error}
                    </div>
                )}
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
                        onChange={(event) =>
                            table
                                .getColumn('name')
                                ?.setFilterValue(event.target.value)
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
                                    .filter((column) => column.getCanHide())
                                    .map((column) => {
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(
                                                        !!value,
                                                    )
                                                }
                                            >
                                                {column.id}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="overflow-hidden rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext(),
                                                      )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={
                                            row.getIsSelected() && 'selected'
                                        }
                                    >
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
                                        className="h-24 text-center"
                                    >
                                        <FormattedMessage defaultMessage="No results." />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        <FormattedMessage
                            defaultMessage="{selected} of {total} row(s) selected."
                            values={{
                                selected:
                                    table.getFilteredSelectedRowModel().rows
                                        .length,
                                total: table.getFilteredRowModel().rows.length,
                            }}
                        />
                    </div>
                    <div className="space-x-2">
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
            </div>
        </CompanyDashboardLayout>
    );
}
