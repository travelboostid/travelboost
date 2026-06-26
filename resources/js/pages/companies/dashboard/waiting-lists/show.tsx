import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WaitingListStatusBadge } from '@/components/waiting-list/waiting-list-status-badge';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    ArrowDownIcon,
    ArrowLeftIcon,
    ArrowUpIcon,
    CalendarIcon,
    InfoIcon,
    SendIcon,
    UsersIcon,
} from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

type QueueEntry = {
    id: number;
    status: string;
    queue_position: number | null;
    manual_queue_position: number | null;
    pax_adult: number;
    pax_child: number;
    pax_infant: number;
    offered_at?: string | null;
    offer_expires_at?: string | null;
    waiting_list?: {
        id: number;
        contact_name: string;
        contact_email: string;
        contact_phone: string;
        status: string;
        created_at?: string | null;
        customer_user?: {
            id: number;
            name: string;
            email: string;
        } | null;
        tour?: {
            id: number;
            code?: string | null;
            name: string;
        } | null;
    } | null;
    booking?: {
        id: number;
        booking_number: string;
        status: string;
    } | null;
};

type PageProps = {
    schedule: {
        id: number;
        departure_date: string;
        return_date: string;
        is_past_booking_deadline: boolean;
        tour?: {
            id: number;
            code?: string | null;
            name: string;
        } | null;
        availability?: {
            available: number;
            max_pax: number;
        } | null;
    };
    queue: QueueEntry[];
    permissions: {
        can_manage_queues: boolean;
    };
};

export default function Page({ schedule, queue, permissions }: PageProps) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const canManageQueues = permissions.can_manage_queues;
    const companyType = String(company.type ?? '').toLowerCase();
    const waitingListMenuId =
        companyType === 'agent'
            ? 'agent-tours.waiting-lists'
            : 'tours.waiting-lists';
    const isPastDeadline = schedule.is_past_booking_deadline;
    const queuedEntries = queue.filter((entry) => entry.status === 'queued');

    const moveEntry = (index: number, direction: -1 | 1) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= queuedEntries.length) {
            return;
        }

        const reordered = [...queuedEntries];
        const [moved] = reordered.splice(index, 1);
        reordered.splice(targetIndex, 0, moved);

        router.patch(
            `/companies/${company.username}/dashboard/waiting-lists/schedules/${schedule.id}/queue/reorder`,
            { order: reordered.map((entry) => entry.id) },
            { preserveScroll: true },
        );
    };

    const offerEntry = (entry: QueueEntry) => {
        if (!entry.waiting_list) {
            return;
        }

        router.post(
            `/companies/${company.username}/dashboard/waiting-lists/${entry.waiting_list.id}/schedules/${entry.id}/offer`,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <CompanyDashboardLayout
            containerClassName="w-full flex-1 flex flex-col"
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Waiting Lists',
                    }),
                    href: `/companies/${company.username}/dashboard/waiting-lists`,
                },
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Queue',
                    }),
                },
            ]}
            activeMenuIds={[waitingListMenuId]}
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Waiting List Queue',
                })}
            />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
                <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    <div className="border-b px-5 py-4">
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="-ml-2 mb-2 h-8 w-fit"
                        >
                            <Link
                                href={`/companies/${company.username}/dashboard/waiting-lists`}
                            >
                                <ArrowLeftIcon className="mr-1.5 size-4" />
                                <FormattedMessage defaultMessage="Back to waiting lists" />
                            </Link>
                        </Button>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            <FormattedMessage defaultMessage="Schedule queue" />
                        </p>
                        <h1 className="mt-1.5 text-balance text-xl font-semibold tracking-tight sm:text-2xl">
                            {schedule.tour?.name ?? (
                                <FormattedMessage defaultMessage="Tour" />
                            )}
                        </h1>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5 tabular-nums">
                                <CalendarIcon className="size-3.5" />
                                {dayjs(schedule.departure_date).format(
                                    'DD MMM YYYY',
                                )}
                                {' – '}
                                {dayjs(schedule.return_date).format(
                                    'DD MMM YYYY',
                                )}
                            </span>
                            <span className="inline-flex items-center gap-1.5 tabular-nums">
                                <UsersIcon className="size-3.5" />
                                <FormattedMessage
                                    defaultMessage="{count} seats available"
                                    values={{
                                        count:
                                            schedule.availability?.available ??
                                            0,
                                    }}
                                />
                            </span>
                            {isPastDeadline ? (
                                <Badge
                                    variant="outline"
                                    className="border-destructive/30 bg-destructive/10 text-destructive"
                                >
                                    <FormattedMessage defaultMessage="Past booking deadline" />
                                </Badge>
                            ) : null}
                        </div>
                    </div>

                    {canManageQueues && !isPastDeadline ? (
                        <div className="flex items-start gap-3 border-b bg-sky-500/5 px-5 py-3 text-sm text-sky-900 dark:text-sky-200">
                            <InfoIcon className="mt-0.5 size-4 shrink-0" />
                            <p className="text-pretty leading-6">
                                <FormattedMessage defaultMessage="The next queued customer is offered a seat automatically when availability opens. Reorder the queue below or use manual offer only when you need to override the automatic flow." />
                            </p>
                        </div>
                    ) : null}

                    {isPastDeadline ? (
                        <div className="border-b bg-destructive/5 px-5 py-3 text-sm text-destructive">
                            <FormattedMessage defaultMessage="This departure has passed the booking deadline. The queue is read-only and no further offers can be sent." />
                        </div>
                    ) : null}
                </div>

                <div className="grid gap-3">
                    {queue.length === 0 ? (
                        <div className="rounded-2xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
                            <FormattedMessage defaultMessage="No active waiting-list entries for this schedule." />
                        </div>
                    ) : (
                        queue.map((entry) => {
                            const isQueued = entry.status === 'queued';
                            const queuedIndex = queuedEntries.findIndex(
                                (queued) => queued.id === entry.id,
                            );

                            return (
                                <div
                                    key={entry.id}
                                    className="rounded-2xl border bg-card p-4 shadow-sm"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground">
                                                {entry.waiting_list
                                                    ?.contact_name ?? (
                                                    <FormattedMessage defaultMessage="Customer" />
                                                )}
                                            </p>
                                            <p className="truncate text-sm text-muted-foreground">
                                                {
                                                    entry.waiting_list
                                                        ?.contact_email
                                                }
                                            </p>
                                            <p className="mt-2 text-sm tabular-nums text-muted-foreground">
                                                <FormattedMessage
                                                    defaultMessage="{adult, plural, one {# adult} other {# adults}}{child, plural, =0 {} other {, {child, plural, one {# child} other {# children}}}}{infant, plural, =0 {} other {, {infant, plural, one {# infant} other {# infants}}}}"
                                                    values={{
                                                        adult: entry.pax_adult,
                                                        child: entry.pax_child,
                                                        infant: entry.pax_infant,
                                                    }}
                                                />
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <WaitingListStatusBadge
                                                status={entry.status}
                                            />
                                            {isQueued &&
                                            entry.queue_position !== null ? (
                                                <span className="text-xs tabular-nums text-muted-foreground">
                                                    <FormattedMessage
                                                        defaultMessage="Position #{position}"
                                                        values={{
                                                            position:
                                                                entry.queue_position,
                                                        }}
                                                    />
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>

                                    {entry.booking ? (
                                        <p className="mt-3 text-sm text-muted-foreground">
                                            <FormattedMessage
                                                defaultMessage="Booking {number}"
                                                values={{
                                                    number: entry.booking
                                                        .booking_number,
                                                }}
                                            />
                                        </p>
                                    ) : null}

                                    {isQueued &&
                                    canManageQueues &&
                                    !isPastDeadline ? (
                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="size-8"
                                                disabled={queuedIndex <= 0}
                                                aria-label={intl.formatMessage({
                                                    defaultMessage:
                                                        'Move up in queue',
                                                })}
                                                onClick={() =>
                                                    moveEntry(queuedIndex, -1)
                                                }
                                            >
                                                <ArrowUpIcon className="size-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="size-8"
                                                disabled={
                                                    queuedIndex < 0 ||
                                                    queuedIndex >=
                                                        queuedEntries.length - 1
                                                }
                                                aria-label={intl.formatMessage({
                                                    defaultMessage:
                                                        'Move down in queue',
                                                })}
                                                onClick={() =>
                                                    moveEntry(queuedIndex, 1)
                                                }
                                            >
                                                <ArrowDownIcon className="size-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    offerEntry(entry)
                                                }
                                            >
                                                <SendIcon className="mr-2 size-4" />
                                                <FormattedMessage defaultMessage="Manual offer" />
                                            </Button>
                                        </div>
                                    ) : null}

                                    {entry.offer_expires_at ? (
                                        <p
                                            className={cn(
                                                'mt-3 text-sm tabular-nums',
                                                dayjs(
                                                    entry.offer_expires_at,
                                                ).isBefore(dayjs())
                                                    ? 'text-muted-foreground'
                                                    : 'text-amber-700 dark:text-amber-300',
                                            )}
                                        >
                                            <FormattedMessage
                                                defaultMessage="Offer expires {date}"
                                                values={{
                                                    date: dayjs(
                                                        entry.offer_expires_at,
                                                    ).format(
                                                        'DD MMM YYYY HH:mm',
                                                    ),
                                                }}
                                            />
                                        </p>
                                    ) : null}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
