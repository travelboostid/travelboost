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
import { Head, router, useForm, usePage } from '@inertiajs/react';
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
import { FormattedMessage, useIntl } from 'react-intl';

type AgentTier = {
    id: number;
    name: string;
    sort_order: number;
    is_active: boolean;
};

const buildTierFormState = (tier?: AgentTier) => ({
    name: tier?.name ?? '',
    sort_order: tier?.sort_order ?? 0,
    is_active: tier?.is_active ?? true,
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

function TierFormDialog({
    tier,
    children,
}: {
    tier?: AgentTier;
    children: React.ReactNode;
}) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = ReactLib.useState(false);
    const form = useForm(buildTierFormState(tier));

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (nextOpen) {
            form.setData(buildTierFormState(tier));
        }
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.setData(buildTierFormState(tier));
                setOpen(false);
            },
        };

        if (tier) {
            form.put(
                `/companies/${company.username}/dashboard/agent-tiers/${tier.id}`,
                options,
            );

            return;
        }

        form.post(
            `/companies/${company.username}/dashboard/agent-tiers`,
            options,
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="border-b px-6 py-5 text-left">
                    <DialogTitle>
                        {tier ? (
                            <FormattedMessage defaultMessage="Edit Agent Category" />
                        ) : (
                            <FormattedMessage defaultMessage="Add Agent Category" />
                        )}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit}>
                    <div className="space-y-4 px-6 py-5">
                        <div className="grid gap-2">
                            <Label>
                                <FormattedMessage defaultMessage="Name" />
                            </Label>
                            <Input
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                placeholder={intl.formatMessage({
                                    defaultMessage: 'Wholesaler',
                                })}
                            />
                            {form.errors.name && (
                                <p className="text-sm text-red-500">
                                    {form.errors.name}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                <FormattedMessage defaultMessage="Sort Order" />
                            </Label>
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
                            <Label>
                                <FormattedMessage defaultMessage="Active" />
                            </Label>
                            <Switch
                                checked={form.data.is_active}
                                onCheckedChange={(checked) =>
                                    form.setData('is_active', checked)
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex-col gap-2 border-t bg-muted/20 px-6 py-4 sm:flex-col">
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={form.processing}
                        >
                            <FormattedMessage defaultMessage="Save" />
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RowAction({ tier }: { tier: AgentTier }) {
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
                            <TierFormDialog tier={tier}>
                                <DropdownMenuItem
                                    onSelect={(event) => event.preventDefault()}
                                    className="cursor-pointer"
                                >
                                    <EditIcon className="mr-2 h-4 w-4" />
                                    <FormattedMessage defaultMessage="Edit" />
                                </DropdownMenuItem>
                            </TierFormDialog>
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
                                <FormattedMessage defaultMessage="Delete" />
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            <FormattedMessage defaultMessage="Delete Agent Category" />
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <FormattedMessage defaultMessage="This action cannot be undone. The category will be removed permanently if it is not used by commission rules." />
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            <FormattedMessage defaultMessage="Cancel" />
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                router.delete(
                                    `/companies/${company.username}/dashboard/agent-tiers/${tier.id}`,
                                    { preserveScroll: true },
                                )
                            }
                        >
                            <FormattedMessage defaultMessage="Delete" />
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export const columns: ColumnDef<AgentTier>[] = [
    {
        id: 'actions',
        header: () => (
            <div className="px-2 text-center text-[11px] font-bold tracking-wider text-primary">
                <FormattedMessage defaultMessage="Actions" />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => <RowAction tier={row.original} />,
    },
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <SortableHeader
                column={column}
                title={<FormattedMessage defaultMessage="Agent Category" />}
            />
        ),
        cell: ({ row }) => (
            <div className="flex min-w-[240px] items-center gap-3">
                <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                        {row.original.name}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        <FormattedMessage
                            defaultMessage="Sort order {order}"
                            values={{ order: row.original.sort_order }}
                        />
                    </p>
                </div>
            </div>
        ),
    },
    {
        accessorKey: 'sort_order',
        header: ({ column }) => (
            <SortableHeader
                column={column}
                title={<FormattedMessage defaultMessage="Sort Order" />}
            />
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
            <SortableHeader
                column={column}
                title={<FormattedMessage defaultMessage="Status" />}
            />
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
                {row.original.is_active ? (
                    <FormattedMessage defaultMessage="Active" />
                ) : (
                    <FormattedMessage defaultMessage="Inactive" />
                )}
            </Badge>
        ),
    },
];

export default function Page({ tiers }: { tiers: AgentTier[] }) {
    const intl = useIntl();
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
            const item = row.original as AgentTier;

            return [
                item.name,
                String(item.sort_order),
                item.is_active ? 'active' : 'inactive',
            ].some((value) => value.toLowerCase().includes(search));
        },
        [],
    );

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: tiers,
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
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Commission Setup',
                    }),
                },
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Agent Categories',
                    }),
                },
            ]}
            openMenuIds={['commission-setup']}
            activeMenuIds={['commission-setup.agent-tiers']}
            applet={
                <TierFormDialog>
                    <Button>
                        <PlusIcon className="h-4 w-4" />
                        <FormattedMessage defaultMessage="Add Agent Category" />
                    </Button>
                </TierFormDialog>
            }
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Agent Categories',
                })}
            />

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
                                placeholder={intl.formatMessage({
                                    defaultMessage:
                                        'Search category, order, or status',
                                })}
                                value={globalFilter}
                                onChange={(event) =>
                                    setGlobalFilter(event.target.value)
                                }
                                className="h-9 w-full rounded-lg border-slate-200 bg-background pl-9 pr-9 text-xs font-medium shadow-inner shadow-slate-100/70 transition-all placeholder:text-[13px] placeholder:font-normal placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:shadow-black/20 dark:placeholder:text-slate-500"
                            />
                            {globalFilter.trim() !== '' && (
                                <button
                                    type="button"
                                    aria-label={intl.formatMessage({
                                        defaultMessage: 'Clear search',
                                    })}
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
                                <FormattedMessage defaultMessage="View Columns" />
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
                                            <FormattedMessage defaultMessage="No results." />
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
