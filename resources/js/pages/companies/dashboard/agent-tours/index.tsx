import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { extractImageSrc } from '@/lib/utils';
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
import relativeTime from 'dayjs/plugin/relativeTime';
import { ChevronDown, EyeIcon, TrashIcon } from 'lucide-react';
import * as React from 'react';
import TourDeleteConfirmDialog from './components/tour-delete-confirm-dialog';
import TourDetailDialog from './components/tour-detail-dialog';
import type { AgentTour } from './type';

dayjs.extend(relativeTime);

function RowActions({ tour }: { tour: AgentTour }) {
  return (
    <div className="flex gap-2">
      <TourDeleteConfirmDialog tour={tour}>
        <Button variant="destructive" size="sm">
          <TrashIcon className="h-4 w-4" />
        </Button>
      </TourDeleteConfirmDialog>

      <TourDetailDialog tour={tour}>
        <Button size="sm">
          <EyeIcon className="h-4 w-4" />
        </Button>
      </TourDetailDialog>
    </div>
  );
}

export const columns: ColumnDef<AgentTour>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
    id: 'vendor',
    accessorFn: (row) => row.tour.company?.name || '-',
    header: 'Vendor',
  },
  {
    id: 'code',
    accessorFn: (row) => row.tour.code,
    header: 'Code',
    cell: ({ getValue }) => (
      <div className="capitalize">{getValue<string>()}</div>
    ),
  },
  {
    id: 'name',
    accessorFn: (row) => row.tour.name,
    header: 'Name',
  },
  {
    id: 'destination',
    accessorFn: (row) =>
      `${row.tour.continent} - ${row.tour.country} - ${row.tour.destination}`,
    header: 'Destination',
  },
  {
    id: 'image',
    header: 'Image',
    cell: ({ row }) => {
      const { src } = extractImageSrc(row.original.tour.image);
      return (
        <img src={src} alt="Tour" className="aspect-video w-16 object-cover" />
      );
    },
    enableSorting: false,
  },
  {
    id: 'created_at',
    accessorFn: (row) => row.tour.created_at,
    header: 'Created At',
    cell: ({ getValue }) => <div>{dayjs(getValue<string>()).fromNow()}</div>,
  },
  {
    id: 'status',
    accessorFn: (row) => row.tour.status,
    header: 'Status',
  },
  {
    id: 'category',
    accessorFn: (row) => row.tour.category?.name ?? '-',
    header: 'Category',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <RowActions tour={row.original} />,
    enableHiding: false,
    enableSorting: false,
  },
];

interface PageProps {
  data: AgentTour[];
}

export default function AgentToursPage({ data }: PageProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

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
      openMenuIds={['tours']}
      activeMenuIds={['tours.index']}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'My Tours' },
      ]}
    >
      <div className="w-full space-y-4 p-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter tour name..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <Table className="min-w-175 table-fixed border">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </p>
          <div className="flex gap-2">
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
      </div>
    </CompanyDashboardLayout>
  );
}
