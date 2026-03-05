import type { Company } from '@/api/model';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DEFAULT_PHOTO } from '@/config';
import { useDataTable } from '@/hooks/use-data-table';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Trash2Icon, UserIcon } from 'lucide-react';
import { useMemo } from 'react';
import DeleteRegistrationDialog from './components/delete-registration-dialog';
import { EmptyRegistrations } from './components/empty-registrations';
dayjs.extend(relativeTime);

type PageProps = {
  data: {
    data: any[];
  };
};

export default function Page({ data }: PageProps) {
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'vendor.name',
        accessorKey: 'vendor.name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Vendor" />
        ),
        cell: ({ row }) => {
          const vendor = row.original.vendor;
          return (
            <div className="flex gap-2 items-center">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={vendor.photo_url || DEFAULT_PHOTO}
                  alt={vendor.name}
                />
                <AvatarFallback>
                  <UserIcon />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{vendor.name}</div>
                <div className="text-sm text-muted-foreground">
                  {vendor.username}
                </div>
              </div>
            </div>
          );
        },
        enableColumnFilter: false,
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        cell: ({ cell }) => (
          <div className="font-medium">{cell.getValue<string>()}</div>
        ),
        enableColumnFilter: true,
      },
      {
        id: 'created_at',
        accessorKey: 'created_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Join Date" />
        ),
        cell: ({ cell }) => {
          const createdAt = cell.getValue<Company['created_at']>();
          return (
            <div className="text-sm text-muted-foreground">
              {dayjs(createdAt).fromNow()}
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <DeleteRegistrationDialog registration={row.original}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                  >
                    <Trash2Icon />
                  </Button>
                </DeleteRegistrationDialog>
              </TooltipTrigger>
              <TooltipContent>Cancel</TooltipContent>
            </Tooltip>
          );
        },
        size: 32,
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
    pageCount: 1,
    shallow: false,
    initialState: {
      sorting: [{ id: 'id', desc: true }],
      columnPinning: { right: ['actions'] },
    },
    getRowId: (row) => row.id.toString(),
  });

  return (
    <CompanyDashboardLayout
      containerClassName="p-4"
      breadcrumb={[{ title: 'Settings' }, { title: 'Vendor Registrations' }]}
    >
      <DataTable table={table} renderEmptyState={<EmptyRegistrations />}>
        <DataTableToolbar table={table} />
      </DataTable>
    </CompanyDashboardLayout>
  );
}
