import { Button } from '@/components/ui/button';
import { WaitingListStatusBadge } from '@/components/waiting-list/waiting-list-status-badge';
import { shouldShowScheduleStatusBadge } from '@/lib/waiting-list-status';
import { Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import { FormattedMessage } from 'react-intl';

export type WaitingListScheduleCardData = {
    id: number;
    status?: string;
    pax_adult: number;
    pax_child: number;
    pax_infant: number;
    accepts_partial_fulfillment: boolean;
    minimum_partial_seats: number | null;
    display_price_at_request: string | number;
    is_past_booking_deadline?: boolean;
    is_manageable?: boolean;
    tour_schedule?: {
        id: number;
        departure_date: string;
        return_date: string;
    } | null;
};

type WaitingListScheduleCardProps = {
    schedule: WaitingListScheduleCardData;
    parentStatus: string;
    companyUsername: string;
    canManageQueues: boolean;
    formatCurrency: (value: string | number) => string;
};

export function WaitingListScheduleCard({
    schedule,
    parentStatus,
    companyUsername,
    canManageQueues,
    formatCurrency,
}: WaitingListScheduleCardProps) {
    const isPastDeadline = schedule.is_past_booking_deadline === true;
    const isManageable = schedule.is_manageable === true && canManageQueues;
    const tourScheduleId = schedule.tour_schedule?.id;
    const showScheduleStatus = shouldShowScheduleStatusBadge(
        schedule.status,
        parentStatus,
        isPastDeadline,
    );

    return (
        <div className="rounded-lg border bg-background px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-foreground">
                    {schedule.tour_schedule ? (
                        <>
                            {dayjs(
                                schedule.tour_schedule.departure_date,
                            ).format('DD MMM YYYY')}
                            {' – '}
                            {dayjs(schedule.tour_schedule.return_date).format(
                                'DD MMM YYYY',
                            )}
                        </>
                    ) : (
                        <FormattedMessage defaultMessage="Schedule unavailable" />
                    )}
                </span>
                {showScheduleStatus && schedule.status ? (
                    <WaitingListStatusBadge
                        status={schedule.status}
                        className="h-5 rounded-md px-2 text-[10px]"
                    />
                ) : null}
            </div>

            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="tabular-nums">
                    <FormattedMessage
                        defaultMessage="Adult {count}"
                        values={{ count: schedule.pax_adult }}
                    />
                </span>
                <span className="tabular-nums">
                    <FormattedMessage
                        defaultMessage="Child {count}"
                        values={{ count: schedule.pax_child }}
                    />
                </span>
                <span className="tabular-nums">
                    <FormattedMessage
                        defaultMessage="Infant {count}"
                        values={{ count: schedule.pax_infant }}
                    />
                </span>
                <span className="tabular-nums font-medium text-foreground">
                    {formatCurrency(schedule.display_price_at_request)}
                </span>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
                {schedule.accepts_partial_fulfillment ? (
                    <FormattedMessage
                        defaultMessage="Partial allowed · min {count} seats"
                        values={{
                            count: schedule.minimum_partial_seats ?? '–',
                        }}
                    />
                ) : (
                    <FormattedMessage defaultMessage="Full group only" />
                )}
            </p>

            {tourScheduleId && isManageable ? (
                <div className="mt-2.5">
                    <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                    >
                        <Link
                            href={`/companies/${companyUsername}/dashboard/waiting-lists/schedules/${tourScheduleId}`}
                        >
                            <FormattedMessage defaultMessage="Manage queue" />
                        </Link>
                    </Button>
                </div>
            ) : null}

            {tourScheduleId && !canManageQueues && !isPastDeadline ? (
                <div className="mt-2.5">
                    <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                    >
                        <Link
                            href={`/companies/${companyUsername}/dashboard/waiting-lists/schedules/${tourScheduleId}`}
                        >
                            <FormattedMessage defaultMessage="View queue" />
                        </Link>
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
