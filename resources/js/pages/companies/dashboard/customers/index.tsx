import type { UserResource } from '@/api/model';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
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
import { Head } from '@inertiajs/react';
import type { Column, ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import relativeTime from 'dayjs/plugin/relativeTime';
import { EyeIcon, MoreHorizontal, Text, UserCircle } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyCustomers } from './components/empty-customers';

dayjs.extend(relativeTime);
dayjs.locale('id');

type CustomersPageProps = {
    data: {
        data: UserResource[];
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
        <div className="grid grid-cols-3 items-center gap-4 py-2.5 border-b border-slate-100 last:border-0">
            <span className="text-sm font-medium text-slate-500">{label}</span>
            <span className="col-span-2 text-sm font-semibold text-slate-800 break-words">
                {value || '-'}
            </span>
        </div>
    );
}

export default function CustomersPage({ data }: CustomersPageProps) {
    const columns = useMemo<ColumnDef<UserResource>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <div className="px-1 flex items-center justify-center">
                        <Checkbox
                            checked={
                                table.getIsAllPageRowsSelected() ||
                                (table.getIsSomePageRowsSelected() &&
                                    'indeterminate')
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
                            onCheckedChange={(value) =>
                                row.toggleSelected(!!value)
                            }
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
                id: 'name',
                accessorKey: 'name',
                header: ({
                    column,
                }: {
                    column: Column<UserResource, unknown>;
                }) => <DataTableColumnHeader column={column} label="Name" />,
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                            <UserCircle className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col max-w-[200px] xl:max-w-[250px] truncate">
                            <span
                                className="font-bold text-primary truncate"
                                title={row.original.name}
                            >
                                {row.original.name}
                            </span>
                            <span
                                className="text-[10px] text-muted-foreground truncate"
                                title={row.original.username}
                            >
                                @{row.original.username || '-'}
                            </span>
                        </div>
                    </div>
                ),
                meta: {
                    label: 'Name',
                    placeholder: 'Search names...',
                    variant: 'text',
                    icon: Text,
                },
                enableColumnFilter: true,
            },
            {
                id: 'email',
                accessorKey: 'email',
                header: ({
                    column,
                }: {
                    column: Column<UserResource, unknown>;
                }) => <DataTableColumnHeader column={column} label="Email" />,
                cell: ({ cell }) => (
                    <div
                        className="text-slate-600 font-medium truncate max-w-[200px]"
                        title={cell.getValue<string>()}
                    >
                        {cell.getValue<string>()}
                    </div>
                ),
                meta: {
                    label: 'Email',
                    placeholder: 'Search email...',
                    variant: 'text',
                    icon: Text,
                },
                enableColumnFilter: true,
            },
            {
                id: 'phone',
                accessorKey: 'phone',
                header: ({
                    column,
                }: {
                    column: Column<UserResource, unknown>;
                }) => <DataTableColumnHeader column={column} label="Phone" />,
                cell: ({ cell }) => (
                    <div className="text-slate-600 whitespace-nowrap">
                        {cell.getValue<string>() || '-'}
                    </div>
                ),
            },
            {
                id: 'agent',
                accessorKey: 'company.name',
                header: ({
                    column,
                }: {
                    column: Column<UserResource, unknown>;
                }) => <DataTableColumnHeader column={column} label="Agent" />,
                cell: ({ row }) => {
                    const companyName = (row.original as any).company?.name;
                    return (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 whitespace-nowrap">
                            {companyName ?? 'Direct'}
                        </span>
                    );
                },
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({
                    column,
                }: {
                    column: Column<UserResource, unknown>;
                }) => (
                    <DataTableColumnHeader column={column} label="Join Date" />
                ),
                cell: ({ cell }) => (
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                        {dayjs(cell.getValue<string>()).format('D MMMM YYYY')}
                    </div>
                ),
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    const customer = row.original;
                    return (
                        <div className="flex items-center gap-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-8 w-8 text-secondary-foreground hover:bg-secondary/80 shadow-sm"
                                    >
                                        <EyeIcon className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[450px]">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-bold text-primary border-b pb-4">
                                            Customer Profile
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="flex flex-col gap-1 py-2">
                                        <DetailRow
                                            label="Full Name"
                                            value={customer.name}
                                        />
                                        <DetailRow
                                            label="Username"
                                            value={`@${customer.username}`}
                                        />
                                        <DetailRow
                                            label="Email"
                                            value={customer.email}
                                        />
                                        <DetailRow
                                            label="Phone Number"
                                            value={customer.phone}
                                        />
                                        <DetailRow
                                            label="Gender"
                                            value={
                                                <span className="capitalize">
                                                    {(customer as any).gender}
                                                </span>
                                            }
                                        />
                                        <DetailRow
                                            label="Address"
                                            value={customer.address}
                                        />
                                        <DetailRow
                                            label="Status"
                                            value={
                                                <span
                                                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${(customer as any).status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}
                                                >
                                                    {(customer as any).status}
                                                </span>
                                            }
                                        />
                                        <DetailRow
                                            label="Agent"
                                            value={
                                                (customer as any).company
                                                    ?.name ??
                                                'Direct Registration'
                                            }
                                        />
                                        <DetailRow
                                            label="Join Date"
                                            value={dayjs(
                                                customer.created_at,
                                            ).format('D MMMM YYYY, HH:mm')}
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
                                        <span className="sr-only">
                                            Open menu
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                >
                                    <DropdownMenuItem className="cursor-pointer">
                                        History Booking
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer">
                                        Send Notification
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
            sorting: [{ id: 'id', desc: true }],
            columnPinning: { right: ['actions'] },
        },
        getRowId: (row) => row.id.toString(),
    });

    return (
        <CompanyDashboardLayout
            containerClassName="w-full flex-1 flex flex-col"
            breadcrumb={[{ title: 'Customers' }]}
            activeMenuIds={['customers']}
        >
            <Head title="Customers" />
            <div className="w-full space-y-6 p-4 md:p-6 pb-20">
                {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Customers Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all customer data, bookings, and notifications.
            </p>
          </div>
        </div> */}

                <div className="rounded-xl border border-border bg-card shadow-sm w-full p-4 overflow-hidden">
                    <DataTable
                        table={table}
                        renderEmptyState={<EmptyCustomers />}
                    >
                        <DataTableToolbar table={table} />
                    </DataTable>
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
