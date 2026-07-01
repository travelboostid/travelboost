import TenantLayout from '@/components/layouts/tenant-layout';
import { Button } from '@/components/ui/button';
import { Head, router } from '@inertiajs/react';
import { BellIcon, CheckIcon, Trash2Icon } from 'lucide-react';

type NotificationItem = {
    id: string;
    type: string;
    data: {
        title?: string;
        message?: string;
        action_url?: string;
    };
    read_at: string | null;
    created_at: string;
};

type PaginatedNotifications = {
    data: NotificationItem[];
};

export default function CustomerNotifications({
    data,
}: {
    data: PaginatedNotifications;
}) {
    const notifications = data.data ?? [];

    const markAsRead = (id: string) => {
        router.put(`/me/notifications/${id}`, {}, { preserveScroll: true });
    };

    const deleteNotification = (id: string) => {
        router.delete(`/me/notifications/${id}`, { preserveScroll: true });
    };

    const markAllAsRead = () => {
        router.post(
            '/me/notifications/mark-all-as-read',
            {},
            { preserveScroll: true },
        );
    };

    return (
        <TenantLayout>
            <Head title="Notifications" />
            <main className="min-h-screen bg-background">
                <div className="mx-auto w-full max-w-3xl px-4 py-8">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Notifications
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Booking payment and document reminders.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={markAllAsRead}
                            disabled={notifications.every(
                                (notification) => notification.read_at,
                            )}
                        >
                            <CheckIcon className="size-4" />
                            Mark all read
                        </Button>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="rounded-lg border bg-card p-8 text-center">
                            <BellIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
                            <p className="font-semibold">No notifications</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                New booking updates will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map((notification) => {
                                const unread = !notification.read_at;

                                return (
                                    <div
                                        key={notification.id}
                                        className={`rounded-lg border bg-card p-4 ${
                                            unread ? 'border-primary/40' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {unread && (
                                                        <span className="size-2 rounded-full bg-primary" />
                                                    )}
                                                    <h2 className="font-semibold">
                                                        {notification.data
                                                            .title ??
                                                            'Notification'}
                                                    </h2>
                                                </div>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {notification.data
                                                        .message ?? ''}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 flex-col items-end gap-1">
                                                <span className="text-[11px] text-muted-foreground/80 font-medium">
                                                    {new Intl.DateTimeFormat('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    }).format(new Date(notification.created_at))}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {unread && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                markAsRead(
                                                                    notification.id,
                                                                )
                                                            }
                                                        >
                                                            <CheckIcon className="size-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            deleteNotification(
                                                                notification.id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2Icon className="size-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </TenantLayout>
    );
}
