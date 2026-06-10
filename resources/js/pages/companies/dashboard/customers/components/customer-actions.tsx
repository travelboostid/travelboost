import type { UserResource } from '@/api/model';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import { Textarea } from '@/components/ui/textarea';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { BellIcon, EyeIcon, HistoryIcon, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

export type CustomerRow = UserResource & {
    gender?: string | null;
    status?: string | null;
    company?: {
        id: number;
        name: string;
    } | null;
};

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-3 items-center gap-4 border-b border-slate-100 py-2.5 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {label}
            </span>
            <span className="col-span-2 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
                {value || '-'}
            </span>
        </div>
    );
}

export function CustomerActions({ customer }: { customer: CustomerRow }) {
    const { company } = usePageSharedDataProps();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationForm = useForm({
        title: '',
        message: '',
        channel: 'dashboard',
    });

    const historyUrl = `/companies/${company.username}/dashboard/bookings?contact_name=${encodeURIComponent(customer.name)}`;

    const sendNotification = () => {
        notificationForm.post(
            `/companies/${company.username}/dashboard/customers/${customer.id}/send-notification`,
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsNotificationOpen(false);
                    notificationForm.reset('title', 'message');
                    notificationForm.setData('channel', 'dashboard');
                },
            },
        );
    };

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
                        <DropdownMenuItem
                            onSelect={(event) => {
                                event.preventDefault();
                                setIsProfileOpen(true);
                            }}
                            className="cursor-pointer"
                        >
                            <EyeIcon className="mr-2 h-4 w-4" />
                            View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={(event) => {
                                event.preventDefault();
                                router.get(
                                    historyUrl,
                                    {},
                                    {
                                        preserveState: false,
                                        preserveScroll: false,
                                    },
                                );
                            }}
                            className="cursor-pointer"
                        >
                            <HistoryIcon className="mr-2 h-4 w-4" />
                            History Booking
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={(event) => {
                                event.preventDefault();
                                setIsNotificationOpen(true);
                            }}
                            className="cursor-pointer"
                        >
                            <BellIcon className="mr-2 h-4 w-4" />
                            Send Notification
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle className="border-b pb-4 text-xl font-bold text-primary">
                            Customer Profile
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <DetailRow label="Full Name" value={customer.name} />
                        <DetailRow
                            label="Username"
                            value={
                                customer.username
                                    ? `@${customer.username}`
                                    : '-'
                            }
                        />
                        <DetailRow label="Email" value={customer.email} />
                        <DetailRow
                            label="Phone Number"
                            value={customer.phone}
                        />
                        <DetailRow
                            label="Gender"
                            value={
                                <span className="capitalize">
                                    {customer.gender || '-'}
                                </span>
                            }
                        />
                        <DetailRow label="Address" value={customer.address} />
                        <DetailRow
                            label="Status"
                            value={
                                <span
                                    className={cn(
                                        'inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase',
                                        customer.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-slate-100 text-slate-600',
                                    )}
                                >
                                    {customer.status || '-'}
                                </span>
                            }
                        />
                        <DetailRow
                            label="Agent"
                            value={
                                customer.company?.name ?? 'Direct Registration'
                            }
                        />
                        <DetailRow
                            label="Join Date"
                            value={dayjs(customer.created_at).format(
                                'D MMMM YYYY, HH:mm',
                            )}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isNotificationOpen}
                onOpenChange={setIsNotificationOpen}
            >
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>Send Notification</DialogTitle>
                        <DialogDescription>
                            Send a custom notification to {customer.name} via
                            dashboard, email, or both.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Title
                            </label>
                            <Input
                                value={notificationForm.data.title}
                                onChange={(event) =>
                                    notificationForm.setData(
                                        'title',
                                        event.target.value,
                                    )
                                }
                                placeholder="Enter notification title"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Delivery Channel
                            </label>
                            <Select
                                value={notificationForm.data.channel}
                                onValueChange={(value) =>
                                    notificationForm.setData('channel', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dashboard">
                                        Dashboard Only
                                    </SelectItem>
                                    <SelectItem value="email">
                                        Email Only
                                    </SelectItem>
                                    <SelectItem value="both">Both</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Message
                            </label>
                            <Textarea
                                rows={5}
                                value={notificationForm.data.message}
                                onChange={(event) =>
                                    notificationForm.setData(
                                        'message',
                                        event.target.value,
                                    )
                                }
                                placeholder="Write your message for the customer"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => setIsNotificationOpen(false)}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={sendNotification}
                            disabled={notificationForm.processing}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Send Notification
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
