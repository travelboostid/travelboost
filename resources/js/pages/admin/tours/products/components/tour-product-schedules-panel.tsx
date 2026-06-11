import InputError from '@/components/input-error';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MoneyInput from '@/components/ui/money-input';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn, formatIDR } from '@/lib/utils';
import {
    destroy as destroySchedule,
    store as storeSchedules,
} from '@/routes/admin/tours/products/schedules';
import { router } from '@inertiajs/react';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    CalendarDays,
    CalendarPlus,
    CircleAlert,
    Loader2,
    Package,
    Save,
    Trash2,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

dayjs.extend(relativeTime);

type PriceCategory = { id: number; name: string };

type SchedulePrice = {
    id?: number | null;
    room_type_id: number | null;
    price: string;
};

type ScheduleAddOn = {
    id?: number | null;
    description: string;
    price: number | '';
};

export type TourScheduleFormRow = {
    _key: string;
    id?: number | null;
    departure_date: string;
    return_date: string;
    prices: SchedulePrice[];
    availability?: {
        max_pax?: number | null;
        available?: number | null;
    } | null;
    add_ons?: ScheduleAddOn[];
};

type Props = {
    tourId: number;
    durationDays?: number | string | null;
    priceCategories: PriceCategory[];
    initialSchedules: TourScheduleFormRow[];
};

type ScheduleFilter = 'all' | 'upcoming' | 'past';

type ScheduleStatus = 'draft' | 'upcoming' | 'past';

function scheduleKey(schedule: { id?: number | null }, index: number): string {
    return schedule.id ? `id-${schedule.id}` : `new-${index}`;
}

function mapSchedulesFromTour(schedules: any[]): TourScheduleFormRow[] {
    return (schedules || []).map((schedule, index) => ({
        _key: scheduleKey(schedule, index),
        id: schedule.id,
        departure_date: schedule.departure_date ?? '',
        return_date: schedule.return_date ?? '',
        availability: schedule.availability
            ? {
                  max_pax: schedule.availability.max_pax,
                  available: schedule.availability.available,
              }
            : { max_pax: 0, available: 0 },
        prices: (schedule.prices || []).map((price: any) => ({
            id: price.id,
            room_type_id: price.price_category_id,
            price: String(price.price ?? ''),
        })),
        add_ons: (schedule.add_ons || []).map((addon: any) => ({
            id: addon.id,
            description: addon.description ?? '',
            price: addon.price ?? '',
        })),
    }));
}

function emptySchedule(priceCategories: PriceCategory[]): TourScheduleFormRow {
    return {
        _key: `new-${Date.now()}`,
        departure_date: '',
        return_date: '',
        prices: priceCategories.map((category) => ({
            room_type_id: category.id,
            price: '0',
        })),
        availability: { max_pax: 0, available: 0 },
        add_ons: [],
    };
}

function addDays(date: string, days: number): string {
    if (!date || !days) {
        return '';
    }

    return dayjs(date)
        .add(days - 1, 'day')
        .format('YYYY-MM-DD');
}

function getScheduleStatus(departureDate: string): ScheduleStatus {
    if (!departureDate) {
        return 'draft';
    }

    if (dayjs(departureDate).isBefore(dayjs(), 'day')) {
        return 'past';
    }

    return 'upcoming';
}

function tripDurationDays(
    departureDate: string,
    returnDate: string,
): number | null {
    if (!departureDate || !returnDate) {
        return null;
    }

    return dayjs(returnDate).diff(dayjs(departureDate), 'day') + 1;
}

function lowestPrice(prices: SchedulePrice[]): number {
    const values = prices
        .map((price) => Number(price.price) || 0)
        .filter((value) => value > 0);

    return values.length > 0 ? Math.min(...values) : 0;
}

function availabilityPercent(available: number, maxPax: number): number {
    if (maxPax <= 0) {
        return 0;
    }

    return Math.min(100, Math.round((available / maxPax) * 100));
}

const STATUS_LABELS: Record<ScheduleStatus, string> = {
    draft: 'Draft',
    upcoming: 'Upcoming',
    past: 'Past',
};

export function TourProductSchedulesPanel({
    tourId,
    durationDays,
    priceCategories,
    initialSchedules,
}: Props) {
    const [schedules, setSchedules] = useState<TourScheduleFormRow[]>(
        mapSchedulesFromTour(initialSchedules),
    );
    const [baseline, setBaseline] = useState(() =>
        JSON.stringify(mapSchedulesFromTour(initialSchedules)),
    );
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [filter, setFilter] = useState<ScheduleFilter>('all');
    const [expanded, setExpanded] = useState<string[]>([]);
    const [pendingDelete, setPendingDelete] = useState<{
        schedule: TourScheduleFormRow;
        index: number;
    } | null>(null);

    useEffect(() => {
        const mapped = mapSchedulesFromTour(initialSchedules);
        setSchedules(mapped);
        setBaseline(JSON.stringify(mapped));
    }, [initialSchedules]);

    const isDirty = JSON.stringify(schedules) !== baseline;

    const sortedSchedules = useMemo(
        () =>
            schedules
                .map((schedule, index) => ({ schedule, index }))
                .sort((a, b) => {
                    if (!a.schedule.departure_date) {
                        return -1;
                    }

                    if (!b.schedule.departure_date) {
                        return 1;
                    }

                    return a.schedule.departure_date.localeCompare(
                        b.schedule.departure_date,
                    );
                }),
        [schedules],
    );

    const filteredSchedules = useMemo(() => {
        if (filter === 'all') {
            return sortedSchedules;
        }

        return sortedSchedules.filter(({ schedule }) => {
            const status = getScheduleStatus(schedule.departure_date);

            return filter === 'upcoming'
                ? status === 'upcoming' || status === 'draft'
                : status === 'past';
        });
    }, [sortedSchedules, filter]);

    const stats = useMemo(() => {
        const upcoming = schedules.filter(
            (schedule) =>
                getScheduleStatus(schedule.departure_date) === 'upcoming',
        );
        const nextDeparture = [...upcoming]
            .sort((a, b) => a.departure_date.localeCompare(b.departure_date))
            .at(0)?.departure_date;
        const soldOut = schedules.filter((schedule) => {
            const max = schedule.availability?.max_pax ?? 0;
            const available = schedule.availability?.available ?? 0;

            return max > 0 && available <= 0;
        }).length;

        return {
            total: schedules.length,
            upcoming: upcoming.length,
            nextDeparture,
            soldOut,
        };
    }, [schedules]);

    const isDuplicateDeparture = (date: string, index: number): boolean => {
        if (!date) {
            return false;
        }

        return schedules.some(
            (schedule, scheduleIndex) =>
                scheduleIndex !== index && schedule.departure_date === date,
        );
    };

    const updateSchedule = (
        index: number,
        patch: Partial<TourScheduleFormRow>,
    ) => {
        setSchedules((current) =>
            current.map((row, rowIndex) =>
                rowIndex === index ? { ...row, ...patch } : row,
            ),
        );
    };

    const updateDepartureDate = (index: number, value: string) => {
        if (isDuplicateDeparture(value, index)) {
            toast.error('This departure date is already used');
            return;
        }

        const returnDate =
            value && durationDays
                ? addDays(value, Number(durationDays))
                : schedules[index].return_date;

        updateSchedule(index, {
            departure_date: value,
            return_date: returnDate,
        });
    };

    const updateReturnDate = (index: number, value: string) => {
        const departure = schedules[index].departure_date;

        if (departure && value && value < departure) {
            toast.error('Return date cannot be before departure');
            return;
        }

        updateSchedule(index, { return_date: value });
    };

    const updatePrice = (
        scheduleIndex: number,
        priceIndex: number,
        price: string,
    ) => {
        setSchedules((current) =>
            current.map((schedule, rowIndex) => {
                if (rowIndex !== scheduleIndex) {
                    return schedule;
                }

                const prices = [...schedule.prices];
                prices[priceIndex] = { ...prices[priceIndex], price };

                return { ...schedule, prices };
            }),
        );
    };

    const handleAddSchedule = () => {
        const newSchedule = emptySchedule(priceCategories);
        setSchedules((current) => [newSchedule, ...current]);
        setExpanded((current) => [...current, newSchedule._key]);
    };

    const validateBeforeSave = (): boolean => {
        const missingDate = schedules.find(
            (schedule) => !schedule.departure_date,
        );

        if (missingDate) {
            toast.error('Every schedule needs a departure date');
            setExpanded((current) =>
                current.includes(missingDate._key)
                    ? current
                    : [...current, missingDate._key],
            );
            return false;
        }

        const dates = schedules.map((schedule) => schedule.departure_date);
        const hasDuplicates = dates.length !== new Set(dates).size;

        if (hasDuplicates) {
            toast.error('Duplicate departure dates are not allowed');
            return false;
        }

        return true;
    };

    const handleSaveSchedules = async () => {
        if (!validateBeforeSave()) {
            return;
        }

        setSaving(true);

        try {
            await axios.post(storeSchedules({ tour: tourId }).url, {
                schedules: schedules.map((schedule) => ({
                    id: schedule.id,
                    departure_date: schedule.departure_date,
                    return_date: schedule.return_date || null,
                    availability: schedule.availability,
                    prices: schedule.prices.map((price) => ({
                        id: price.id,
                        room_type_id: price.room_type_id,
                        price: price.price,
                        promotion: { type: 'percent', value: 0 },
                        commission: { type: 'percent', value: 0 },
                    })),
                    add_ons: schedule.add_ons,
                })),
            });

            toast.success('Schedules saved successfully');
            router.reload({ only: ['tour'] });
        } catch {
            toast.error('Failed to save schedules');
        } finally {
            setSaving(false);
        }
    };

    const confirmDeleteSchedule = () => {
        if (!pendingDelete) {
            return;
        }

        const { schedule, index } = pendingDelete;

        if (!schedule.id) {
            setSchedules((current) => current.filter((_, i) => i !== index));
            setPendingDelete(null);
            toast.success('Schedule removed');
            return;
        }

        setDeletingId(schedule.id);

        router.delete(
            destroySchedule({ tour: tourId, schedule: schedule.id }).url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSchedules((current) =>
                        current.filter((row) => row.id !== schedule.id),
                    );
                    toast.success('Schedule deleted');
                    setPendingDelete(null);
                },
                onError: () => toast.error('Failed to delete schedule'),
                onFinish: () => setDeletingId(null),
            },
        );
    };

    const categoryName = (id: number | null) =>
        priceCategories.find((category) => category.id === id)?.name || 'Room';

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold">
                        Schedules & pricing
                    </h2>
                    <p className="max-w-xl text-sm text-muted-foreground">
                        Configure departure dates, room tiers, and seat
                        availability. Changes are saved separately from tour
                        details.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {isDirty ? (
                        <Badge variant="outline" className="gap-1">
                            <CircleAlert className="size-3" />
                            Unsaved changes
                        </Badge>
                    ) : null}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddSchedule}
                    >
                        <CalendarPlus className="size-4" />
                        Add departure
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSaveSchedules}
                        disabled={saving || !isDirty}
                    >
                        {saving ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Save className="size-4" />
                        )}
                        Save schedules
                    </Button>
                </div>
            </div>

            <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                    {stats.total}
                </span>{' '}
                departures
                <span className="mx-2 text-border">·</span>
                <span className="font-medium text-foreground">
                    {stats.upcoming}
                </span>{' '}
                upcoming
                {stats.nextDeparture ? (
                    <>
                        <span className="mx-2 text-border">·</span>
                        Next {dayjs(stats.nextDeparture).format('D MMM YYYY')}
                    </>
                ) : null}
                {stats.soldOut > 0 ? (
                    <>
                        <span className="mx-2 text-border">·</span>
                        {stats.soldOut} sold out
                    </>
                ) : null}
            </p>

            <div className="flex flex-wrap items-center gap-2">
                {(
                    [
                        { value: 'all', label: 'All' },
                        { value: 'upcoming', label: 'Upcoming' },
                        { value: 'past', label: 'Past' },
                    ] as const
                ).map((option) => (
                    <Button
                        key={option.value}
                        type="button"
                        size="sm"
                        variant={
                            filter === option.value ? 'default' : 'outline'
                        }
                        onClick={() => setFilter(option.value)}
                    >
                        {option.label}
                    </Button>
                ))}
                {durationDays ? (
                    <span className="text-xs text-muted-foreground">
                        Auto return date uses {durationDays}-day tour duration
                    </span>
                ) : null}
            </div>

            {filteredSchedules.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <CalendarDays className="size-8 text-muted-foreground/60" />
                    <div className="space-y-1">
                        <p className="font-medium">
                            {filter === 'all'
                                ? 'No schedules yet'
                                : `No ${filter} schedules`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Add a departure to set room prices and availability.
                        </p>
                    </div>
                    {filter === 'all' ? (
                        <Button type="button" onClick={handleAddSchedule}>
                            <CalendarPlus className="size-4" />
                            Add first departure
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setFilter('all')}
                        >
                            Show all schedules
                        </Button>
                    )}
                </div>
            ) : (
                <Accordion
                    type="multiple"
                    value={expanded}
                    onValueChange={setExpanded}
                    className="w-full"
                >
                    {filteredSchedules.map(({ schedule, index }) => {
                        const status = getScheduleStatus(
                            schedule.departure_date,
                        );
                        const maxPax = schedule.availability?.max_pax ?? 0;
                        const available = schedule.availability?.available ?? 0;
                        const fillPercent = availabilityPercent(
                            available,
                            maxPax,
                        );
                        const minPrice = lowestPrice(schedule.prices);
                        const duration = tripDurationDays(
                            schedule.departure_date,
                            schedule.return_date,
                        );

                        return (
                            <AccordionItem
                                key={schedule._key}
                                value={schedule._key}
                                className="border-b px-1 last:border-b-0"
                            >
                                <AccordionTrigger className="py-3 hover:no-underline">
                                    <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 pr-2 text-left text-sm">
                                        <span className="font-medium">
                                            {schedule.departure_date
                                                ? dayjs(
                                                      schedule.departure_date,
                                                  ).format('ddd, D MMM YYYY')
                                                : 'New departure'}
                                        </span>
                                        {schedule.return_date ? (
                                            <span className="text-muted-foreground">
                                                –{' '}
                                                {dayjs(
                                                    schedule.return_date,
                                                ).format('D MMM YYYY')}
                                                {duration
                                                    ? ` (${duration}d)`
                                                    : ''}
                                            </span>
                                        ) : null}
                                        <Badge
                                            variant={
                                                status === 'upcoming'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                            className="font-normal"
                                        >
                                            {STATUS_LABELS[status]}
                                        </Badge>
                                        {maxPax > 0 ? (
                                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                <Users className="size-3.5" />
                                                {available}/{maxPax}
                                            </span>
                                        ) : null}
                                        {minPrice > 0 ? (
                                            <span className="text-muted-foreground">
                                                from {formatIDR(minPrice)}
                                            </span>
                                        ) : null}
                                        {(schedule.add_ons?.length ?? 0) > 0 ? (
                                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                <Package className="size-3.5" />
                                                {schedule.add_ons?.length}{' '}
                                                add-ons
                                            </span>
                                        ) : null}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-6 pb-4 pt-1">
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor={`dep-${schedule._key}`}
                                            >
                                                Departure date
                                            </Label>
                                            <Input
                                                id={`dep-${schedule._key}`}
                                                type="date"
                                                value={schedule.departure_date}
                                                onChange={(event) =>
                                                    updateDepartureDate(
                                                        index,
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor={`ret-${schedule._key}`}
                                            >
                                                Return date
                                            </Label>
                                            <Input
                                                id={`ret-${schedule._key}`}
                                                type="date"
                                                min={
                                                    schedule.departure_date ||
                                                    undefined
                                                }
                                                value={schedule.return_date}
                                                onChange={(event) =>
                                                    updateReturnDate(
                                                        index,
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Max pax</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={maxPax}
                                                onChange={(event) =>
                                                    updateSchedule(index, {
                                                        availability: {
                                                            ...schedule.availability,
                                                            max_pax: Number(
                                                                event.target
                                                                    .value,
                                                            ),
                                                        },
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Available</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={maxPax || undefined}
                                                value={available}
                                                onChange={(event) =>
                                                    updateSchedule(index, {
                                                        availability: {
                                                            ...schedule.availability,
                                                            available: Number(
                                                                event.target
                                                                    .value,
                                                            ),
                                                        },
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>

                                    {maxPax > 0 ? (
                                        <div className="max-w-xs space-y-1.5">
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Availability</span>
                                                <span>{fillPercent}%</span>
                                            </div>
                                            <Progress
                                                value={fillPercent}
                                                className={cn(
                                                    fillPercent === 0 &&
                                                        '[&_[data-slot=progress-indicator]]:bg-destructive',
                                                    fillPercent > 0 &&
                                                        fillPercent <= 25 &&
                                                        '[&_[data-slot=progress-indicator]]:bg-amber-500',
                                                )}
                                            />
                                        </div>
                                    ) : null}

                                    <div className="space-y-2">
                                        <Label>Room prices</Label>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Category
                                                    </TableHead>
                                                    <TableHead className="w-48">
                                                        Price
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {schedule.prices.map(
                                                    (price, priceIndex) => (
                                                        <TableRow
                                                            key={`${price.room_type_id}-${priceIndex}`}
                                                        >
                                                            <TableCell className="font-medium">
                                                                {categoryName(
                                                                    price.room_type_id,
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <MoneyInput
                                                                    value={
                                                                        price.price
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) =>
                                                                        updatePrice(
                                                                            index,
                                                                            priceIndex,
                                                                            value,
                                                                        )
                                                                    }
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ),
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {(schedule.add_ons?.length ?? 0) > 0 ? (
                                        <div className="space-y-2">
                                            <Label>Add-ons (read-only)</Label>
                                            <ul className="divide-y text-sm">
                                                {schedule.add_ons?.map(
                                                    (addon) => (
                                                        <li
                                                            key={
                                                                addon.id ??
                                                                addon.description
                                                            }
                                                            className="flex items-center justify-between gap-3 py-2 first:pt-0"
                                                        >
                                                            <span className="text-muted-foreground">
                                                                {
                                                                    addon.description
                                                                }
                                                            </span>
                                                            <span className="tabular-nums">
                                                                {formatIDR(
                                                                    Number(
                                                                        addon.price ||
                                                                            0,
                                                                    ),
                                                                )}
                                                            </span>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    ) : null}

                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            disabled={
                                                deletingId === schedule.id
                                            }
                                            onClick={() =>
                                                setPendingDelete({
                                                    schedule,
                                                    index,
                                                })
                                            }
                                        >
                                            {deletingId === schedule.id ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="size-4" />
                                            )}
                                            Remove departure
                                        </Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            )}

            {isDirty ? (
                <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t bg-background px-1 py-3">
                    <p className="text-sm text-muted-foreground">
                        You have unsaved schedule changes.
                    </p>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const mapped =
                                    mapSchedulesFromTour(initialSchedules);
                                setSchedules(mapped);
                                setBaseline(JSON.stringify(mapped));
                            }}
                        >
                            Discard
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSaveSchedules}
                            disabled={saving}
                        >
                            {saving ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Save className="size-4" />
                            )}
                            Save schedules
                        </Button>
                    </div>
                </div>
            ) : null}

            <AlertDialog
                open={pendingDelete !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove departure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingDelete?.schedule.departure_date
                                ? `This will remove the ${dayjs(pendingDelete.schedule.departure_date).format('D MMM YYYY')} departure and its pricing.`
                                : 'This will remove the unsaved departure.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={confirmDeleteSchedule}
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <InputError />
        </div>
    );
}
