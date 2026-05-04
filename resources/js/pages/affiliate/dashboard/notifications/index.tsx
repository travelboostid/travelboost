import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDataTable } from '@/hooks/use-data-table';
import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  CheckCheckIcon,
  EyeIcon,
  MoreHorizontal,
  TrashIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';

dayjs.extend(relativeTime);
dayjs.locale('id');

type NotificationResource = {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: any;
  read_at: string | null;
  created_at: string;
  updated_at: string;
};

type NotificationsPageProps = {
  data: {
    data: NotificationResource[];
    total: number;
  };
};

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 items-start gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="col-span-2 text-sm font-semibold text-slate-800 break-words whitespace-pre-wrap">
        {value || '-'}
      </span>
    </div>
  );
}

export default function NotificationsPage({ data }: NotificationsPageProps) {
  const markAsRead = (id: string) => {
    router.put(
      `/affiliate/dashboard/notifications/${id}`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => toast.success('Notification marked as read'),
      },
    );
  };

  const markAllAsRead = () => {
    router.post(
      `/affiliate/dashboard/notifications/mark-all-as-read`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => toast.success('All notifications marked as read'),
      },
    );
  };

  const deleteNotification = (id: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      router.delete(`/affiliate/dashboard/notifications/${id}`, {
        preserveScroll: true,
        onSuccess: () => toast.success('Notification deleted'),
      });
    }
  };

  const columns = useMemo<ColumnDef<NotificationResource>[]>(
    () => [
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
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: 'status',
        accessorKey: 'read_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        cell: ({ row }) => (
          <div>
            {row.original.read_at ? (
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-600 border-none text-[10px]"
              >
                Read
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-600 border-none hover:bg-red-100 text-[10px]">
                Unread
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: 'title',
        accessorKey: 'data.title',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Notification" />
        ),
        cell: ({ row }) => {
          const notif = row.original;
          const title = notif.data?.title || 'System Notification';
          const message = notif.data?.message || 'You have a new message.';

          return (
            <div className="flex flex-col max-w-[300px] xl:max-w-[450px]">
              <span className="font-bold text-primary truncate" title={title}>
                {title}
              </span>
              <span
                className="text-xs text-muted-foreground truncate"
                title={message}
              >
                {message}
              </span>
            </div>
          );
        },
      },
      {
        id: 'created_at',
        accessorKey: 'created_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Date" />
        ),
        cell: ({ cell }) => (
          <div className="text-xs text-slate-500 whitespace-nowrap">
            {dayjs(cell.getValue<string>()).format('DD MMMM YYYY, HH:mm')}
          </div>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const notif = row.original;
          return (
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 text-secondary-foreground hover:bg-secondary/80 shadow-sm"
                    onClick={() => !notif.read_at && markAsRead(notif.id)}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-primary border-b pb-4">
                      Notification Details
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-1 py-2">
                    <DetailRow
                      label="Title"
                      value={notif.data?.title || 'System Notification'}
                    />
                    <DetailRow
                      label="Message"
                      value={notif.data?.message || '-'}
                    />
                    <DetailRow
                      label="Date"
                      value={dayjs(notif.created_at).format(
                        'DD MMMM YYYY, HH:mm',
                      )}
                    />
                    <DetailRow
                      label="Status"
                      value={
                        <Badge
                          variant={notif.read_at ? 'secondary' : 'destructive'}
                        >
                          {notif.read_at ? 'Read' : 'Unread'}
                        </Badge>
                      }
                    />
                  </div>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shadow-sm border-slate-200"
                  >
                    <MoreHorizontal className="h-4 w-4 text-slate-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {!notif.read_at && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => markAsRead(notif.id)}
                    >
                      <CheckCheckIcon className="mr-2 h-4 w-4" /> Mark as Read
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                    onClick={() => deleteNotification(notif.id)}
                  >
                    <TrashIcon className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 32,
        enableSorting: false,
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
    rowCount: data.total,
    shallow: false,
    initialState: {
      sorting: [{ id: 'created_at', desc: true }],
      columnPinning: { right: ['actions'] },
    },
    getRowId: (row) => row.id,
  });

  return (
    <AffiliateDashboardLayout
      containerClassName="w-full flex-1 flex flex-col"
      breadcrumb={[{ title: 'Notifications' }]}
      activeMenuIds={['notifications']}
    >
      <Head title="Notifications" />
      <div className="w-full space-y-6 p-4 md:p-6 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Notifications
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all system updates and alerts.
            </p>
          </div>
          <Button
            onClick={markAllAsRead}
            variant="outline"
            className="shadow-sm"
          >
            <CheckCheckIcon className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm w-full p-4 overflow-hidden">
          <DataTable table={table}>
            <DataTableToolbar table={table} />
          </DataTable>
        </div>
      </div>
    </AffiliateDashboardLayout>
  );
}
