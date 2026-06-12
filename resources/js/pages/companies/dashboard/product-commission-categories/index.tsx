import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import { router, useForm, usePage } from '@inertiajs/react';
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
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronDown,
    EditIcon,
    MoreHorizontal,
    PlusIcon,
    Search,
    TrashIcon,
    XIcon,
} from 'lucide-react';
import type React from 'react';
import * as ReactLib from 'react';

type CommissionCategory = {
    id: number;
    name: string;
    sort_order: number;
    is_active: boolean;
};

const buildCategoryFormState = (category?: CommissionCategory) => ({
    name: category?.name ?? '',
    sort_order: category?.sort_order ?? 0,
    is_active: category?.is_active ?? true,
});

function SortableHeader({
    column,
    title,
    className,
}: {
    column: any;
    title: React.ReactNode;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className={cn(
                'flex h-8 items-center font-bold text-primary',
                className,
            )}
        >
            <span>{title}</span>
            {column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
            )}
        </button>
    );
}

function CategoryFormDialog({
    category,
    children,
}: {
    category?: CommissionCategory;
    children: React.ReactNode;
}) {
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = ReactLib.useState(false);
    const form = useForm(buildCategoryFormState(category));

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (nextOpen) {
            form.setData(buildCategoryFormState(category));
        }
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.setData(buildCategoryFormState(category));
                setOpen(false);
            },
        };

        if (category) {
            form.put(
                `/companies/${company.username}/dashboard/product-commission-categories/${category.id}`,
                options,
            );
            return;
        }

        form.post(
            `/companies/${company.username}/dashboard/product-commission-categories`,
            options,
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {category
                            ? 'Edit Product Commission Category'
                            : 'Add Product Commission Category'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            placeholder="Promo"
                        />
                        {form.errors.name && (
                            <p className="text-sm text-red-500">
                                {form.errors.name}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label>Sort Order</Label>
                        <Input
                            type="number"
                            value={form.data.sort_order}
                            onChange={(event) =>
                                form.setData(
                                    'sort_order',
                                    Number(event.target.value),
                                )
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                        <Label>Active</Label>
                        <Switch
                            checked={form.data.is_active}
                            onCheckedChange={(checked) =>
                                form.setData('is_active', checked)
                            }
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={form.processing}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RowAction({ category }: { category: CommissionCategory }) {
    const { company } = usePageSharedDataProps();
    const [deleteOpen, setDeleteOpen] = ReactLib.useState(false);

    return (
        <>
            <div className="flex justify-center px-1">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        className="w-52 rounded-xl"
                    >
                        <DropdownMenuGroup>
                            <CategoryFormDialog category={category}>
                                <DropdownMenuItem
                                    onSelect={(event) => event.preventDefault()}
                                    className="cursor-pointer"
                                >
                                    <EditIcon className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                            </CategoryFormDialog>
                        </DropdownMenuGroup>
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                onSelect={(event) => {
                                    event.preventDefault();
                                    setDeleteOpen(true);
                                }}
                                className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                            >
                                <TrashIcon className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete Product Commission Category
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The category will be
                            removed permanently if it is not used by tours or
                            commission rules.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                router.delete(
                                    `/companies/${company.username}/dashboard/product-commission-categories/${category.id}`,
                                    { preserveScroll: true },
                                )
                            }
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export const columns: ColumnDef<CommissionCategory>[] = [
    {
        id: 'actions',
        header: () => (
            <div className="px-2 text-center text-[11px] font-bold tracking-wider text-primary">
                Actions
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => <RowAction category={row.original} />,
    },
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <SortableHeader
                column={column}
                title="Product Commission Category"
            />
        ),
        cell: ({ row }) => (
            <div className="flex min-w-[240px] items-center gap-3">
                <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                        {row.original.name}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        Sort order {row.original.sort_order}
                    </p>
                </div>
            </div>
        ),
    },
    {
        accessorKey: 'sort_order',
        header: ({ column }) => (
            <SortableHeader column={column} title="Sort Order" />
        ),
        cell: ({ row }) => (
            <span className="whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300">
                {row.original.sort_order}
            </span>
        ),
    },
    {
        accessorKey: 'is_active',
        header: ({ column }) => (
            <SortableHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
            <Badge
                variant="secondary"
                className={cn(
                    'rounded-full border-0 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]',
                    row.original.is_active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                )}
            >
                {row.original.is_active ? 'Active' : 'Inactive'}
            </Badge>
        ),
    },
];

export default function Page({
    categories,
}: {
    categories: CommissionCategory[];
}) {
    const { errors } = usePage().props as any;
    const [sorting, setSorting] = ReactLib.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        ReactLib.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        ReactLib.useState<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = ReactLib.useState('');

    const globalFilterFn = ReactLib.useCallback(
        (row: any, _columnId: string, filterValue: string) => {
            const search = filterValue.toLowerCase();
            const item = row.original as CommissionCategory;

            return [
                item.name,
                String(item.sort_order),
                item.is_active ? 'active' : 'inactive',
            ].some((value) => value.toLowerCase().includes(search));
        },
        [],
    );

    const table = useReactTable({
        data: categories,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter,
        },
    });

    const tableRows = table.getRowModel().rows;

    return (
        <CompanyDashboardLayout
            breadcrumb={[
                { title: 'Commission Setup' },
                { title: 'Product Commission Categories' },
            ]}
            openMenuIds={['commission-setup']}
            activeMenuIds={['commission-setup.product-categories']}
            applet={
                <CategoryFormDialog>
                    <Button>
                        <PlusIcon className="h-4 w-4" /> Add Category
                    </Button>
                </CategoryFormDialog>
            }
        >
            <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 p-4 pb-20 md:p-6">
                {errors.delete_error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errors.delete_error}
                    </div>
                )}

                <div className="order-first flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-card/95 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 sm:flex-row sm:items-center sm:justify-between">
                    <div className="w-full min-w-0 sm:max-w-md">
                        <div className="relative">
                            <span className="pointer-events-none absolute left-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 dark:bg-primary/15">
                                <Search className="size-3.5" />
                            </span>
                            <Input
                                placeholder="Search category, order, or status"
                                value={globalFilter}
                                onChange={(event) =>
                                    setGlobalFilter(event.target.value)
                                }
                                className="h-9 w-full rounded-lg border-slate-200 bg-background pl-9 pr-9 text-xs font-medium shadow-inner shadow-slate-100/70 transition-all placeholder:text-[13px] placeholder:font-normal placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:shadow-black/20 dark:placeholder:text-slate-500"
                            />
                            {globalFilter.trim() !== '' && (
                                <button
                                    type="button"
                                    aria-label="Clear search"
                                    onClick={() => setGlobalFilter('')}
                                    className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <XIcon className="size-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="ml-auto h-9 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900 sm:w-auto"
                            >
                                View Columns
                                <ChevronDown className="ml-2 inline h-4 w-4 opacity-50" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-[220px] rounded-xl"
                        >
                            <DropdownMenuGroup>
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="cursor-pointer capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id.replace(/_/g, ' ')}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-none">
                    <div className="relative max-h-[68vh] w-full overflow-auto [scrollbar-gutter:stable]">
                        <Table
                            unwrapped
                            className="w-full border-separate border-spacing-0 text-sm"
                        >
                            <TableHeader className="sticky top-0 z-40 bg-white shadow-[0_1px_0_0_theme(colors.border)] dark:bg-slate-950/95">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow
                                        key={headerGroup.id}
                                        className="border-none bg-white hover:bg-white dark:bg-slate-950/95 dark:hover:bg-slate-950/95"
                                    >
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className={cn(
                                                    'h-12 whitespace-nowrap bg-white px-4 font-bold text-primary dark:bg-slate-950/95',
                                                    header.column.id ===
                                                        'actions' &&
                                                        'sticky left-0 z-50 w-[3.75rem] min-w-[3.75rem] max-w-[3.75rem] border-r border-border/70 bg-white px-0 text-center shadow-[10px_0_14px_-16px_rgba(15,23,42,0.35)] backdrop-blur dark:bg-slate-950/95',
                                                )}
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
                                {tableRows.length ? (
                                    tableRows.map((row, rowIndex) => (
                                        <TableRow
                                            key={row.id}
                                            className="group border-none transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        className={cn(
                                                            'border-b border-border px-4 py-3 align-middle',
                                                            cell.column.id ===
                                                                'actions' &&
                                                                'sticky left-0 z-20 w-[3.75rem] min-w-[3.75rem] max-w-[3.75rem] border-r border-border/70 bg-card px-0 text-center shadow-[10px_0_14px_-16px_rgba(15,23,42,0.35)] transition-colors group-hover:bg-slate-50 dark:bg-slate-950/95 dark:group-hover:bg-slate-900/50',
                                                            cell.column.id ===
                                                                'actions' &&
                                                                rowIndex ===
                                                                    tableRows.length -
                                                                        1 &&
                                                                'rounded-bl-xl',
                                                        )}
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
                                            className="h-40"
                                        >
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
