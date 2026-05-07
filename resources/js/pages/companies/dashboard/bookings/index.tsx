import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatIDR } from '@/constants/booking';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
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
import dayjs from 'dayjs';
import {
  ChevronDown,
  EditIcon,
  EyeIcon,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import * as React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BookingResource = {
  id: number;
  booking_number: string;
  contact_name: string | null;
  status: string;
  pax_adult: number;
  pax_child: number;
  pax_infant: number;
  total_price: string;
  grand_total: string;
  paid_amount: number;
  remaining_balance: number;
  commission_amount: string | null;
  payment_mode: string | null;
  departure_date: string | null;
  created_at: string;
  tour: { id: number; name: string } | null;
  vendor: { id: number; name: string } | null;
  agent: { id: number; name: string } | null;
  user: { id: number; name: string } | null;
};

type PageProps = {
  data: {
    data: BookingResource[];
    total: number;
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
};

const STATUS_TABS = [
  { label: 'All', value: '', style: undefined },
  {
    label: 'Booking Reserved',
    value: 'reserved',
    style: 'bg-teal-100 text-teal-800',
  },
  {
    label: 'Awaiting Payment',
    value: 'awaiting payment',
    style: 'bg-amber-100 text-amber-800',
  },
  {
    label: 'Down Payment',
    value: 'down payment',
    style: 'bg-cyan-100 text-cyan-800',
  },
  {
    label: 'Full Payment',
    value: 'full payment',
    style: 'bg-green-100 text-green-800',
  },
  {
    label: 'Waiting List',
    value: 'waiting list',
    style: 'bg-purple-100 text-purple-800',
  },
  {
    label: 'Manual Reserved',
    value: 'manual reserved',
    style: 'bg-violet-100 text-violet-800',
  },
  { label: 'Cancelled', value: 'cancelled', style: 'bg-red-100 text-red-800' },
  {
    label: 'Refunded',
    value: 'refunded',
    style: 'bg-orange-100 text-orange-800',
  },
  { label: 'Expired', value: 'expired', style: 'bg-gray-100 text-gray-800' },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusStyles: Record<string, string> = {
  reserved: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  'awaiting payment':
    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'down payment':
    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  'full payment':
    'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  completed:
    'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'waiting list':
    'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'manual reserved':
    'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'booking reserved':
    'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-100/80 dark:text-red-300',
  refunded:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300',
};

const statusLabels: Record<string, string> = {
  reserved: 'Booking Reserved',
  'booking reserved': 'Booking Reserved',
  'manual reserved': 'Manual Reserved',
};

function formatCommission(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '—';
  return formatIDR(num);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PaxCell({
  adult,
  child,
  infant,
}: {
  adult: number;
  child: number;
  infant: number;
}) {
  const total = adult + child + infant;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="font-semibold tabular-nums text-sm text-slate-700">
            {total}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {adult} Adult · {child} Child · {infant} Infant
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function RowActions({
  booking,
  companyUsername,
}: {
  booking: BookingResource;
  companyUsername: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 text-secondary-foreground hover:bg-secondary/80 shadow-sm"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link
            href={`/companies/${companyUsername}/dashboard/bookings/${booking.id}`}
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            View Detail
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={`/companies/${companyUsername}/dashboard/bookings/${booking.id}/edit`}
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Column factory
// ---------------------------------------------------------------------------

function buildColumns(
  isAgent: boolean,
  companyUsername: string,
): ColumnDef<BookingResource>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="px-1 flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="border-primary/50 data-[state=checked]:bg-primary"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-1 flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="border-primary/40 data-[state=checked]:bg-primary"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Booking Date',
      cell: ({ cell }) => (
        <div className="whitespace-nowrap text-xs text-slate-500">
          {dayjs(cell.getValue<string>()).format('DD MMM YYYY')}
        </div>
      ),
    },
    {
      id: 'tour_name',
      accessorFn: (row) => row.tour?.name ?? '—',
      header: 'Tour Name',
      cell: ({ row }) => (
        <div
          className="max-w-[180px] xl:max-w-[220px] truncate font-bold text-primary"
          title={row.original.tour?.name ?? '—'}
        >
          {row.original.tour?.name ?? '—'}
        </div>
      ),
    },
    {
      id: 'departure_date',
      accessorKey: 'departure_date',
      header: 'Departure Date',
      cell: ({ cell }) => {
        const val = cell.getValue<string>();
        return (
          <div className="whitespace-nowrap text-xs text-slate-500">
            {val ? dayjs(val).format('DD MMM YYYY') : '—'}
          </div>
        );
      },
    },
    {
      id: 'booking_number',
      accessorKey: 'booking_number',
      header: 'Booking Number',
      cell: ({ cell }) => (
        <span className="uppercase font-mono text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
          {cell.getValue<string>()}
        </span>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ cell }) => {
        const status = cell.getValue<string>();
        return (
          <Badge
            variant="secondary"
            className={cn(
              'capitalize text-[10px] font-bold uppercase tracking-wider',
              statusStyles[status] ?? statusStyles['expired'],
            )}
          >
            {statusLabels[status] ?? status}
          </Badge>
        );
      },
    },
    {
      id: isAgent ? 'vendor' : 'agent',
      accessorFn: (row) =>
        isAgent ? (row.vendor?.name ?? '—') : (row.agent?.name ?? 'Direct'),
      header: isAgent ? 'Vendor' : 'Agent',
      cell: ({ row }) => (
        <div
          className="font-semibold text-slate-700 max-w-[120px] xl:max-w-[150px] truncate"
          title={
            isAgent
              ? (row.original.vendor?.name ?? '—')
              : (row.original.agent?.name ?? 'Direct')
          }
        >
          {isAgent
            ? (row.original.vendor?.name ?? '—')
            : (row.original.agent?.name ?? 'Direct')}
        </div>
      ),
    },
    {
      id: 'contact_name',
      accessorKey: 'contact_name',
      header: 'Ordered By',
      cell: ({ cell }) => (
        <div className="text-slate-600 truncate max-w-[120px]">
          {cell.getValue<string>() || '—'}
        </div>
      ),
    },
    {
      id: 'pax',
      header: 'Pax',
      cell: ({ row }) => (
        <PaxCell
          adult={row.original.pax_adult ?? 0}
          child={row.original.pax_child ?? 0}
          infant={row.original.pax_infant ?? 0}
        />
      ),
      enableSorting: false,
    },
    {
      id: 'grand_total',
      accessorKey: 'grand_total',
      header: 'Grand Total',
      cell: ({ cell }) => (
        <div className="font-medium tabular-nums whitespace-nowrap text-slate-700">
          {formatIDR(cell.getValue<string>())}
        </div>
      ),
    },
    {
      id: 'remaining_balance',
      accessorKey: 'remaining_balance',
      header: 'Remaining',
      cell: ({ row }) => {
        const remaining = row.original.remaining_balance;
        const isSettled = remaining <= 0;

        return (
          <div
            className={cn(
              'tabular-nums whitespace-nowrap font-medium text-sm',
              isSettled ? 'text-emerald-600' : 'text-rose-600',
            )}
          >
            {isSettled ? '—' : formatIDR(remaining)}
          </div>
        );
      },
    },
    {
      id: 'payment_mode',
      accessorKey: 'payment_mode',
      header: 'Payment Mode',
      cell: ({ cell, row }) => {
        const status = row.original.status;
        const mode = cell.getValue<string | null>();
        const showPaymentMode =
          !!mode || !['reserved', 'awaiting payment'].includes(status);

        if (!showPaymentMode) return <span className="text-slate-400">—</span>;

        if (!mode) return <span className="text-slate-400">—</span>;

        const label = mode === 'manual' ? 'Manual Payment' : 'Online Payment';

        return (
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
              mode === 'online'
                ? 'bg-primary/10 text-primary'
                : 'bg-slate-100 text-slate-500',
            )}
          >
            {label}
          </span>
        );
      },
    },
    {
      id: 'commission_amount',
      accessorKey: 'commission_amount',
      header: 'Commission',
      cell: ({ cell }) => (
        <div className="tabular-nums whitespace-nowrap text-slate-600">
          {formatCommission(cell.getValue<string>())}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <RowActions booking={row.original} companyUsername={companyUsername} />
      ),
      enableHiding: false,
      enableSorting: false,
    },
  ];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Page({ data }: PageProps) {
  const { company } = usePageSharedDataProps();
  const isAgent = company.type === 'agent';

  const columns = React.useMemo(
    () => buildColumns(isAgent, company.username),
    [isAgent, company.username],
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const fuzzyFilter = React.useCallback(
    (row: any, _columnId: string, value: string) => {
      const searchVal = String(value).toLowerCase();
      return row.getAllCells().some((cell: any) => {
        const val = cell.getValue();
        if (val == null) return false;

        let strVal = String(val);
        if (cell.column.id === 'created_at' || cell.column.id === 'departure_date') {
          strVal = dayjs(val).format('DD MMM YYYY');
        }

        return strVal.toLowerCase().includes(searchVal);
      });
    },
    [],
  );

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'fuzzy' as any,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <CompanyDashboardLayout
      openMenuIds={['tours']}
      activeMenuIds={isAgent ? ['tours.bookings'] : ['tours.orders']}
      breadcrumb={[{ title: 'Tours' }, { title: 'Bookings' }]}
    >
      <Head title="Bookings" />

      <div className="w-full space-y-6 p-4 md:p-6 max-w-screen-2xl mx-auto pb-20 min-w-0 overflow-hidden">
        {/* ── Page header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Bookings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAgent
                ? 'Manage and monitor bookings for your agency.'
                : 'Manage and monitor bookings from your tours.'}
            </p>
          </div>
        </div>

        {/* ── Status filter tabs ───────────────────────────── */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => {
            const params = new URLSearchParams(window.location.search);
            const activeStatus = params.get('status') ?? '';
            const isActive = activeStatus === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  const url = `/companies/${company.username}/dashboard/bookings`;
                  const query: Record<string, string> = {};
                  params.forEach((v, k) => {
                    if (k !== 'status' && k !== 'page') query[k] = v;
                  });
                  if (tab.value) query.status = tab.value;
                  const qs = new URLSearchParams(query).toString();
                  router.get(
                    qs ? `${url}?${qs}` : url,
                    {},
                    { preserveState: true, preserveScroll: true },
                  );
                }}
                className={cn(
                  'px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border transition-all',
                  isActive
                    ? (tab.style ??
                        'bg-primary/10 text-primary border-primary/30')
                    : 'bg-white text-muted-foreground border-slate-200 hover:bg-slate-50',
                  isActive && !tab.style && 'border-primary/30',
                  isActive && tab.style && 'border-current/20',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Toolbar: search + view-columns ──────────────────── */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-slate-50/50 p-1 rounded-lg">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search booking number, tour, guest..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-9 w-full focus-visible:ring-primary border-slate-200"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto ml-auto bg-white border-slate-200"
              >
                View Columns <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuGroup>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize cursor-pointer"
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

        {/* ── Table card ──────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card shadow-sm w-full overflow-hidden">
          <div className="w-full max-h-[65vh] overflow-auto relative">
            <Table unwrapped className="w-full text-sm">
              <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/90 shadow-[0_1px_0_0_theme(colors.border)]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-none hover:bg-transparent"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="bg-slate-50 dark:bg-slate-900/90 text-primary font-bold h-12 px-3 whitespace-nowrap"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
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
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3 px-3">
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
                      className="h-32 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-lg mb-1">📭</span>
                        <p>No bookings found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ── Pagination footer ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-sm text-muted-foreground bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
            <span className="font-semibold text-foreground">
              {table.getFilteredSelectedRowModel().rows.length}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-foreground">
              {table.getFilteredRowModel().rows.length}
            </span>{' '}
            row(s) selected.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="border-slate-200"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="border-slate-200"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </CompanyDashboardLayout>
  );
}
