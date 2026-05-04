import {
  create,
  edit,
} from '@/actions/App/Http/Controllers/Companies/Dashboard/TourController';
import type { TourResource } from '@/api/model';
import { useGetTourCategories } from '@/api/tour-category/tour-category';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { extractImageSrc } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
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
import {
  ChevronDown,
  EditIcon,
  EyeIcon,
  PlusIcon,
  Search,
  TrashIcon,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import TourDeleteConfirmDialog from './components/tour-delete-confirm-dialog';
import TourDetailDialog from './components/tour-detail-dialog';

dayjs.extend(relativeTime);

function RowActions({ tour }: { tour: TourResource }) {
  const { company } = usePageSharedDataProps();
  return (
    <div className="flex gap-2">
      <TourDetailDialog tour={tour}>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 text-secondary-foreground hover:bg-secondary/80 shadow-sm"
        >
          <EyeIcon className="h-4 w-4" />
        </Button>
      </TourDetailDialog>

      <Link href={edit({ company: company.username, tour: tour.id })}>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50 shadow-sm"
        >
          <EditIcon className="h-4 w-4" />
        </Button>
      </Link>

      <TourDeleteConfirmDialog tour={tour}>
        <Button variant="destructive" size="icon" className="h-8 w-8 shadow-sm">
          <TrashIcon className="h-4 w-4" />
        </Button>
      </TourDeleteConfirmDialog>
    </div>
  );
}

function CategoryCell({ row }: { row: any }) {
  const { company } = usePageSharedDataProps();
  const { data, isLoading } = useGetTourCategories({ company_id: company.id });
  const tour = row.original;

  const [value, setValue] = React.useState(
    tour.category_id?.toString() || 'none',
  );

  React.useEffect(() => {
    setValue(tour.category_id?.toString() || 'none');
  }, [tour.category_id]);

  const handleChange = (val: string) => {
    setValue(val);

    router.put(
      `/companies/${company.username}/dashboard/tours/${tour.id}`,
      { quick_update: true, category_id: val === 'none' ? null : Number(val) },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          toast.success('Category updated successfully');
        },
      },
    );
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select value={value} onValueChange={handleChange} disabled={isLoading}>
        <SelectTrigger className="w-[120px] h-8 text-xs border-slate-200">
          <SelectValue placeholder="Select Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Category</SelectItem>
          {data?.data.map((cat: any) => (
            <SelectItem key={cat.id} value={cat.id.toString()}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function StatusCell({ row }: { row: any }) {
  const { company } = usePageSharedDataProps();
  const tour = row.original;

  const [value, setValue] = React.useState(tour.status || 'inactive');

  React.useEffect(() => {
    setValue(tour.status || 'inactive');
  }, [tour.status]);

  const handleChange = (val: string) => {
    setValue(val);

    router.put(
      `/companies/${company.username}/dashboard/tours/${tour.id}`,
      { quick_update: true, status: val },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          toast.success('Status updated successfully');
        },
      },
    );
  };

  const isActive = value.toLowerCase() === 'active';

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger
          className={`w-[110px] h-8 text-[10px] font-bold uppercase tracking-wider ${
            isActive
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          <SelectValue placeholder="Select Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">ACTIVE</SelectItem>
          <SelectItem value="inactive">INACTIVE</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export const columns: ColumnDef<TourResource>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className="px-1 flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
    id: 'name',
    accessorFn: (row) => row.name,
    header: 'Tour Details',
    cell: ({ row }) => (
      <div className="flex flex-col gap-1.5 max-w-[200px] xl:max-w-[300px]">
        <span
          className="font-bold text-primary truncate"
          title={row.original.name}
        >
          {row.original.name}
        </span>
        <span className="uppercase font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded w-fit border border-slate-200">
          {row.original.code || '-'}
        </span>
      </div>
    ),
  },
  {
    id: 'destination',
    accessorFn: (row) => row.destination,
    header: 'Destination',
    cell: ({ getValue }) => (
      <div
        className="max-w-[150px] xl:max-w-[200px] truncate text-slate-600"
        title={getValue<string>()}
      >
        {getValue<string>() || '-'}
      </div>
    ),
  },
  {
    id: 'image',
    header: 'Image',
    cell: ({ row }) => {
      const image = row.original.image;
      const src = image
        ? extractImageSrc(image as any).src
        : 'https://placehold.co/400x300/e2e8f0/94a3b8?text=No+Image';

      return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm w-16 h-10 flex items-center justify-center shrink-0">
          <img src={src} alt="Tour" className="w-full h-full object-cover" />
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: 'category',
    header: 'Category',
    cell: ({ row }) => <CategoryCell row={row} />,
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusCell row={row} />,
  },
  {
    id: 'created_at',
    accessorFn: (row) => row.created_at,
    header: 'Created At',
    cell: ({ getValue }) => (
      <div className="text-xs text-slate-500 whitespace-nowrap">
        {dayjs(getValue<string>()).format('D MMMM YYYY')}
      </div>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <RowActions tour={row.original} />,
    enableHiding: false,
    enableSorting: false,
  },
];

type PageProps = {
  data: any;
};

export default function Page({ data }: PageProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const { company } = usePageSharedDataProps();
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: data,
    columns,
    getRowId: (row) => row.id.toString(),
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
      breadcrumb={[{ title: 'Tours' }]}
      containerClassName="w-full flex-1 flex flex-col"
    >
      <div className="w-full space-y-6 p-4 md:p-6 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Product Table
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your created tours, availability, pricing, and master data.
            </p>
          </div>
          <Link href={create({ company: company.username })}>
            <Button className="w-full sm:w-auto shadow-sm">
              <PlusIcon className="mr-2 h-4 w-4" /> Create New Tour
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-slate-50/50 p-1 rounded-lg">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tour name..."
              value={
                (table.getColumn('name')?.getFilterValue() as string) ?? ''
              }
              onChange={(event) =>
                table.getColumn('name')?.setFilterValue(event.target.value)
              }
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
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize cursor-pointer"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id.replace('_', ' ')}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm w-full overflow-hidden">
          <div className="w-full overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader className="bg-primary/5">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-primary/10 hover:bg-primary/5"
                  >
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          className="text-primary font-bold h-12 px-3 whitespace-nowrap"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
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
                        <p>No tours found matching your search.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

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
