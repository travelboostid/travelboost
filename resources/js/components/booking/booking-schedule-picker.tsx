import { Badge } from '@/components/ui/badge';
import { formatIDR } from '@/constants/booking';
import { cn } from '@/lib/utils';
import axios from 'axios';
import dayjs from 'dayjs';
import { CalendarIcon, Loader2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

export type RescheduleScheduleOption = {
    id: number;
    departure_date: string;
    return_date: string | null;
    available: number;
    price_from: number;
    is_current: boolean;
    price_preview: {
        grand_total: number;
        price_difference: number;
    };
};

type RescheduleOptionsResponse = {
    current_departure_date: string;
    required_seats: number;
    schedules: RescheduleScheduleOption[];
};

type BookingSchedulePickerProps = {
    companyUsername: string;
    bookingId: number;
    selectedScheduleId: number | null;
    onSelect: (schedule: RescheduleScheduleOption) => void;
    className?: string;
};

function formatDateRange(departure: string, returnDate: string | null) {
    const from = dayjs(departure);
    const to = returnDate ? dayjs(returnDate) : null;

    if (!to || from.isSame(to, 'day')) {
        return from.format('DD MMM YYYY');
    }

    if (from.isSame(to, 'month')) {
        return `${from.format('DD')} - ${to.format('DD MMM YYYY')}`;
    }

    return `${from.format('DD MMM')} - ${to.format('DD MMM YYYY')}`;
}

export default function BookingSchedulePicker({
    companyUsername,
    bookingId,
    selectedScheduleId,
    onSelect,
    className,
}: BookingSchedulePickerProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [options, setOptions] = useState<RescheduleOptionsResponse | null>(
        null,
    );

    useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setError(null);

        axios
            .get<RescheduleOptionsResponse>(
                `/companies/${companyUsername}/dashboard/bookings/${bookingId}/reschedule-options`,
                { withCredentials: true },
            )
            .then((response) => {
                if (cancelled) {
                    return;
                }

                setOptions(response.data);
            })
            .catch(() => {
                if (cancelled) {
                    return;
                }

                setError('Could not load available schedules.');
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [companyUsername, bookingId]);

    if (loading) {
        return (
            <div
                className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-sm text-muted-foreground',
                    className,
                )}
            >
                <Loader2Icon className="size-4 animate-spin" />
                <FormattedMessage defaultMessage="Loading schedules..." />
            </div>
        );
    }

    if (error) {
        return (
            <div
                className={cn(
                    'rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground',
                    className,
                )}
            >
                {error}
            </div>
        );
    }

    if (!options || options.schedules.length === 0) {
        return (
            <div
                className={cn(
                    'rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground',
                    className,
                )}
            >
                <FormattedMessage defaultMessage="No alternative schedules are available for this booking." />
            </div>
        );
    }

    return (
        <div className={cn('space-y-2', className)}>
            <p className="text-xs text-muted-foreground">
                <FormattedMessage
                    defaultMessage="Current departure: {date}"
                    values={{
                        date: dayjs(options.current_departure_date).format(
                            'DD MMM YYYY',
                        ),
                    }}
                />
            </p>
            <div className="grid max-h-56 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {options.schedules.map((schedule) => {
                    const isSelected = selectedScheduleId === schedule.id;
                    const priceDiff = schedule.price_preview.price_difference;

                    return (
                        <button
                            key={schedule.id}
                            type="button"
                            onClick={() => onSelect(schedule)}
                            className={cn(
                                'rounded-lg border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5',
                                isSelected &&
                                    'border-primary/50 bg-primary/5 ring-1 ring-primary/20',
                            )}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                        <CalendarIcon className="size-3.5 shrink-0 text-primary" />
                                        <span className="truncate">
                                            {formatDateRange(
                                                schedule.departure_date,
                                                schedule.return_date,
                                            )}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        <FormattedMessage
                                            defaultMessage="{count} seats available"
                                            values={{
                                                count: schedule.available,
                                            }}
                                        />
                                    </p>
                                </div>
                                <Badge
                                    variant={
                                        schedule.available > 0
                                            ? 'secondary'
                                            : 'destructive'
                                    }
                                    className="shrink-0 text-[0.65rem]"
                                >
                                    <FormattedMessage
                                        defaultMessage="{count} left"
                                        values={{
                                            count: schedule.available,
                                        }}
                                    />
                                </Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-medium text-foreground">
                                    {formatIDR(
                                        schedule.price_preview.grand_total,
                                    )}
                                </span>
                                {priceDiff !== 0 && (
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-0.5 font-medium',
                                            priceDiff > 0
                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
                                        )}
                                    >
                                        {priceDiff > 0 ? '+' : ''}
                                        {formatIDR(priceDiff)}
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
