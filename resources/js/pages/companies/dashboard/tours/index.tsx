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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Link } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table';
import { ChevronDown, PlusIcon, Search } from 'lucide-react';
import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
    getColumns,
    getStickyActionColumnClassName,
} from './components/index/tour-table-columns';

type PageProps = {
    data: any;
    bookingDeadlineDays?: number;
    productCommissionCategories?: {
        id: number;
        category_name: string;
    }[];
};

export default function Page({ data, bookingDeadlineDays = 0 }: PageProps) {
    const intl = useIntl();
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({ image: false });
    const [activeTab, setActiveTab] = React.useState('active');
    const [globalFilter, setGlobalFilter] = React.useState('');
    const { company } = usePageSharedDataProps();

    const columns = React.useMemo(() => getColumns(intl), [intl]);

    const dataWithDeadline = React.useMemo(
        () =>
            data.map((tour: any) => ({
                ...tour,
                booking_deadline_days: bookingDeadlineDays,
            })),
        [data, bookingDeadlineDays],
    );

    const filteredData = React.useMemo(() => {
        let result = dataWithDeadline;
        if (activeTab !== 'all') {
            result = result.filter(
                (tour: any) =>
                    (tour.status || 'inactive').toLowerCase() === activeTab,
            );
        }
        return result;
    }, [dataWithDeadline, activeTab]);

    const globalFilterFn = (
        row: any,
        columnId: string,
        filterValue: string,
    ) => {
        const search = filterValue.toLowerCase();
        const name = (row.original.name || '').toLowerCase();
        const vendor = (row.original.company?.name || '').toLowerCase();
        const category = (row.original.category?.name || '').toLowerCase();
        const productCommissionCategory = (
            row.original.product_commission_category?.category_name ||
            row.original.productCommissionCategory?.category_name ||
            ''
        ).toLowerCase();
        return (
            name.includes(search) ||
            vendor.includes(search) ||
            category.includes(search) ||
            productCommissionCategory.includes(search)
        );
    };

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: filteredData,
        columns,
        getRowId: (row) => row.id.toString(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter,
        },
    });

    return (
        <CompanyDashboardLayout
            openMenuIds={['tours']}
            activeMenuIds={['tours.index']}
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Tours',
                    }),
                },
            ]}
            containerClassName="w-full flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950"
        >
            <div className="w-full space-y-6 p-4 md:p-8 max-w-[1600px] mx-auto pb-20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div>
                        <div className="relative w-full sm:w-[700px] border border-slate-200 rounded-xl shadow-sm dark:border-slate-800">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder={intl.formatMessage({
                                    defaultMessage:
                                        'Search tour, vendor, or category...',
                                })}
                                value={globalFilter ?? ''}
                                onChange={(e) =>
                                    setGlobalFilter(e.target.value)
                                }
                                className="pl-11 h-11 w-full bg-slate-50 border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl transition-all shadow-inner dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:bg-slate-900"
                            />
                        </div>
                    </div>
                    <Link
                        href={`/companies/${company.username}/dashboard/tours/create`}
                    >
                        <Button
                            size="lg"
                            className="w-full sm:w-auto shadow-lg rounded-full px-8 bg-primary hover:bg-primary/90 transition-all hover:scale-105"
                        >
                            <PlusIcon className="mr-2 h-5 w-5" />
                            <FormattedMessage defaultMessage="Create New Tour" />
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full lg:w-auto"
                    >
                        <TabsList className="grid grid-cols-3 w-full lg:w-[350px] bg-slate-100/80 p-1 rounded-xl dark:bg-slate-950/70">
                            <TabsTrigger
                                value="all"
                                className="rounded-lg data-[state=active]:shadow-sm"
                            >
                                <FormattedMessage defaultMessage="All Tours" />
                            </TabsTrigger>
                            <TabsTrigger
                                value="active"
                                className="rounded-lg data-[state=active]:shadow-sm data-[state=active]:text-emerald-600"
                            >
                                <FormattedMessage defaultMessage="Active" />
                            </TabsTrigger>
                            <TabsTrigger
                                value="inactive"
                                className="rounded-lg data-[state=active]:shadow-sm data-[state=active]:text-slate-600"
                            >
                                <FormattedMessage defaultMessage="Inactive" />
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-11 px-6 rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm w-full sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                                >
                                    <FormattedMessage defaultMessage="Columns" />
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-[200px] rounded-xl shadow-xl"
                            >
                                <DropdownMenuGroup>
                                    {table
                                        .getAllColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize cursor-pointer py-2"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(
                                                        !!value,
                                                    )
                                                }
                                            >
                                                {column.id.replace('_', ' ')}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card shadow-sm w-full overflow-hidden dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-none">
                    <div className="w-full overflow-x-auto relative [scrollbar-gutter:stable]">
                        <Table
                            unwrapped
                            className="w-full border-separate border-spacing-0 text-sm"
                        >
                            <TableHeader className="sticky top-0 z-40 bg-slate-50 dark:bg-slate-900/90 shadow-[0_1px_0_0_theme(colors.border)]">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow
                                        key={headerGroup.id}
                                        className="border-none bg-slate-50 hover:bg-slate-50 dark:bg-slate-900/90 dark:hover:bg-slate-900/90"
                                    >
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className={`bg-slate-50 dark:bg-slate-900/90 text-primary font-bold h-12 px-3 whitespace-nowrap ${getStickyActionColumnClassName(header.column.id)} ${header.column.id === 'actions' ? 'rounded-tl-xl overflow-visible' : ''}`}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext(),
                                                      )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            className="group border-none transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        className={`border-b border-border py-3 px-3 ${getStickyActionColumnClassName(cell.column.id)} ${cell.column.id === 'actions' ? 'group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50' : ''} ${cell.column.id === 'actions' && row.index === table.getRowModel().rows.length - 1 ? 'rounded-bl-xl' : ''}`}
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
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
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-lg mb-1">
                                                    📭
                                                </span>
                                                <p>
                                                    <FormattedMessage defaultMessage="No tours found." />
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="border-slate-200 px-6"
                        >
                            <FormattedMessage defaultMessage="Previous" />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="border-slate-200 px-6"
                        >
                            <FormattedMessage defaultMessage="Next" />
                        </Button>
                    </div>
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
