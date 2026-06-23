import { store as storeDashboardWaitingList } from '@/actions/App/Http/Controllers/Companies/Dashboard/TourWaitingListController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { useForm, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    AlertCircleIcon,
    LoaderCircleIcon,
    PlusIcon,
    Trash2Icon,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect } from 'react';

export type WaitingListScheduleOption = {
    id: number;
    departureDate: string;
    returnDate: string;
    available: number;
    displayPrice: number;
};

type WaitingListTour = {
    id: number;
    code?: string | null;
    name: string;
};

type WaitingListScheduleForm = {
    schedule_id: number;
    pax_adult: number;
    pax_child: number;
    pax_infant: number;
    accepts_partial_fulfillment: boolean | null;
    minimum_partial_seats: number | null;
    is_priority: boolean;
};

type WaitingListForm = {
    schedules: WaitingListScheduleForm[];
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    contact_address: string;
};

type TourWaitingListDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    tour: WaitingListTour;
    schedules: WaitingListScheduleOption[];
};

type WaitingListPageProps = {
    activeWaitingListScheduleCount?: number;
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

const emptySchedule = (isPriority: boolean): WaitingListScheduleForm => ({
    schedule_id: 0,
    pax_adult: 0,
    pax_child: 0,
    pax_infant: 0,
    accepts_partial_fulfillment: null,
    minimum_partial_seats: null,
    is_priority: isPriority,
});

export default function TourWaitingListDialog({
    isOpen,
    onClose,
    tour,
    schedules,
}: TourWaitingListDialogProps) {
    const { auth, company } = usePageSharedDataProps();
    const { activeWaitingListScheduleCount = 0 } =
        usePage<WaitingListPageProps>().props;
    const isDashboardRoute =
        typeof window !== 'undefined' &&
        window.location.pathname.includes('/dashboard');
    const isDirectCustomer =
        !isDashboardRoute && auth?.roles?.includes('user:customer');
    const customer = isDirectCustomer ? auth.user : null;
    const customerRemainingSlots = isDirectCustomer
        ? Math.max(0, 2 - activeWaitingListScheduleCount)
        : 2;
    const maximumRows = Math.min(2, customerRemainingSlots);

    const { data, setData, post, processing, errors, clearErrors, reset } =
        useForm<WaitingListForm>({
            schedules: [],
            contact_name: '',
            contact_phone: '',
            contact_email: '',
            contact_address: '',
        });

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setData({
            schedules: [],
            contact_name: customer?.name ?? '',
            contact_phone: customer?.phone ?? '',
            contact_email: customer?.email ?? '',
            contact_address: customer?.address ?? '',
        });
        clearErrors();
    }, [
        clearErrors,
        customer?.address,
        customer?.email,
        customer?.name,
        customer?.phone,
        isOpen,
        setData,
        tour.id,
    ]);

    const addSchedule = () => {
        if (data.schedules.length >= maximumRows) {
            return;
        }

        clearErrors();
        setData('schedules', [
            ...data.schedules,
            emptySchedule(data.schedules.length === 0),
        ]);
    };

    const removeSchedule = (index: number) => {
        const removedWasPriority = data.schedules[index]?.is_priority;
        const remaining = data.schedules.filter(
            (_, rowIndex) => rowIndex !== index,
        );

        if (removedWasPriority && remaining.length > 0) {
            remaining[0] = { ...remaining[0], is_priority: true };
        }

        clearErrors();
        setData('schedules', remaining);
    };

    const updateSchedule = <Key extends keyof WaitingListScheduleForm>(
        index: number,
        key: Key,
        value: WaitingListScheduleForm[Key],
    ) => {
        clearErrors();
        setData(
            'schedules',
            data.schedules.map((schedule, rowIndex) =>
                rowIndex === index ? { ...schedule, [key]: value } : schedule,
            ),
        );
    };

    const scheduleError = (
        index: number,
        field: keyof Pick<
            WaitingListScheduleForm,
            | 'schedule_id'
            | 'pax_adult'
            | 'pax_child'
            | 'pax_infant'
            | 'accepts_partial_fulfillment'
            | 'minimum_partial_seats'
        >,
    ) => errors[`schedules.${index}.${field}`];

    const setPriority = (priorityIndex: number) => {
        clearErrors();
        setData(
            'schedules',
            data.schedules.map((schedule, index) => ({
                ...schedule,
                is_priority: index === priorityIndex,
            })),
        );
    };

    const selectedSchedule = (scheduleId: number) =>
        schedules.find((schedule) => schedule.id === scheduleId);

    const passengerWarning = (selection: WaitingListScheduleForm) => {
        const schedule = selectedSchedule(selection.schedule_id);
        const requiredSeats = selection.pax_adult + selection.pax_child;

        if (!schedule) {
            return null;
        }

        if (requiredSeats < 1) {
            return 'Enter at least one adult or child passenger. Infants are recorded only and do not reduce availability.';
        }

        if (requiredSeats <= schedule.available) {
            return `This schedule still has ${schedule.available} seats. Add more than ${schedule.available} seat-using passengers or use Book Tour instead.`;
        }

        return null;
    };

    const minimumPartialSeatWarning = (selection: WaitingListScheduleForm) => {
        const requiredSeats = selection.pax_adult + selection.pax_child;

        if (selection.accepts_partial_fulfillment !== true) {
            return null;
        }

        if (selection.minimum_partial_seats === null) {
            return 'Enter the minimum number of adult and child passengers who may still proceed.';
        }

        if (selection.minimum_partial_seats < 1) {
            return 'Minimum proceeding passengers must be at least one adult or child passenger.';
        }

        if (selection.minimum_partial_seats > requiredSeats) {
            return 'Minimum proceeding passengers cannot exceed the total adult and child passengers.';
        }

        return null;
    };

    const selectedIds = data.schedules
        .map((schedule) => schedule.schedule_id)
        .filter((id) => id > 0);
    const hasDuplicateSchedules =
        new Set(selectedIds).size !== selectedIds.length;
    const hasInvalidSchedule = data.schedules.some((selection) => {
        const requiredSeats = selection.pax_adult + selection.pax_child;
        const schedule = selectedSchedule(selection.schedule_id);
        const hasInvalidMinimumPartialSeats =
            selection.accepts_partial_fulfillment === true &&
            (selection.minimum_partial_seats === null ||
                selection.minimum_partial_seats < 1 ||
                selection.minimum_partial_seats > requiredSeats);

        return (
            !schedule ||
            requiredSeats < 1 ||
            requiredSeats <= schedule.available ||
            selection.accepts_partial_fulfillment === null ||
            hasInvalidMinimumPartialSeats
        );
    });
    const hasOnePriority =
        data.schedules.filter((schedule) => schedule.is_priority).length === 1;
    const customerLimitReached =
        isDirectCustomer && customerRemainingSlots === 0;
    const cannotSubmit =
        processing ||
        customerLimitReached ||
        data.schedules.length === 0 ||
        hasDuplicateSchedules ||
        hasInvalidSchedule ||
        !hasOnePriority;
    const serverError = Object.entries(errors).find(
        ([key, error]) =>
            key.startsWith('schedules') && typeof error === 'string',
    )?.[1];

    const closeDialog = () => {
        reset();
        clearErrors();
        onClose();
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (cannotSubmit) {
            return;
        }

        const url =
            isDashboardRoute && company?.username
                ? storeDashboardWaitingList({
                      company: company.username,
                      tour: tour.id,
                  }).url
                : `/tours/${tour.id}/waiting-lists`;

        post(url, {
            preserveScroll: true,
            onSuccess: closeDialog,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent className="flex h-[calc(100dvh-2rem)] max-h-[44rem] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:h-[90vh] sm:max-w-2xl md:max-w-3xl">
                <DialogHeader className="shrink-0 border-b bg-card px-4 py-4 text-left sm:px-6">
                    <DialogDescription className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                        {tour.code || 'Tour'}
                    </DialogDescription>
                    <DialogTitle className="text-lg font-bold leading-snug sm:text-xl">
                        {tour.name}
                    </DialogTitle>
                    <DialogDescription>Join the waiting list</DialogDescription>
                </DialogHeader>

                <form
                    id="tour-waiting-list-form"
                    onSubmit={submit}
                    className="min-h-0 flex-1 overflow-y-auto"
                >
                    <div className="space-y-6 px-4 py-5 sm:px-6">
                        {isDirectCustomer && (
                            <div
                                className={`flex gap-3 rounded-lg border p-3 text-sm ${customerLimitReached ? 'border-destructive/40 bg-destructive/5 text-destructive' : 'border-primary/20 bg-primary/5 text-foreground'}`}
                            >
                                <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                                <span>
                                    {customerLimitReached
                                        ? 'You already have two active waiting-listed schedules. Cancel or complete one before adding another.'
                                        : `You have ${activeWaitingListScheduleCount} active waiting-listed schedule${activeWaitingListScheduleCount === 1 ? '' : 's'}. You can add ${customerRemainingSlots} more.`}
                                </span>
                            </div>
                        )}

                        <section className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <Label className="text-sm font-semibold">
                                        Tour schedules{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {data.schedules.length}/2 schedules
                                        added
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addSchedule}
                                    disabled={
                                        customerLimitReached ||
                                        data.schedules.length >= maximumRows
                                    }
                                >
                                    <PlusIcon className="size-4" />
                                    Add Schedule
                                </Button>
                            </div>

                            {data.schedules.length === 0 &&
                                !customerLimitReached && (
                                    <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                                        No schedule added yet.
                                    </div>
                                )}

                            <RadioGroup
                                value={String(
                                    data.schedules.findIndex(
                                        (schedule) => schedule.is_priority,
                                    ),
                                )}
                                onValueChange={(value) =>
                                    setPriority(Number(value))
                                }
                                className="space-y-3"
                            >
                                {data.schedules.map((selection, index) => {
                                    const selected = selectedSchedule(
                                        selection.schedule_id,
                                    );
                                    const warning = passengerWarning(selection);
                                    const minimumPartialSeatsWarning =
                                        minimumPartialSeatWarning(selection);

                                    return (
                                        <div
                                            key={index}
                                            className="space-y-4 rounded-lg border bg-muted/10 p-3 sm:p-4"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-sm font-semibold">
                                                    Schedule {index + 1}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-destructive"
                                                    onClick={() =>
                                                        removeSchedule(index)
                                                    }
                                                    aria-label={`Remove schedule ${index + 1}`}
                                                >
                                                    <Trash2Icon className="size-4" />
                                                </Button>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label>
                                                    Departure schedule{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <Select
                                                    value={
                                                        selection.schedule_id >
                                                        0
                                                            ? String(
                                                                  selection.schedule_id,
                                                              )
                                                            : undefined
                                                    }
                                                    onValueChange={(value) =>
                                                        updateSchedule(
                                                            index,
                                                            'schedule_id',
                                                            Number(value),
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select a departure schedule" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {schedules
                                                            .filter(
                                                                (schedule) =>
                                                                    schedule.id ===
                                                                        selection.schedule_id ||
                                                                    !selectedIds.includes(
                                                                        schedule.id,
                                                                    ),
                                                            )
                                                            .map((schedule) => (
                                                                <SelectItem
                                                                    key={
                                                                        schedule.id
                                                                    }
                                                                    value={String(
                                                                        schedule.id,
                                                                    )}
                                                                >
                                                                    {format(
                                                                        parseISO(
                                                                            schedule.departureDate,
                                                                        ),
                                                                        'dd MMM yyyy',
                                                                    )}{' '}
                                                                    -{' '}
                                                                    {format(
                                                                        parseISO(
                                                                            schedule.returnDate,
                                                                        ),
                                                                        'dd MMM yyyy',
                                                                    )}{' '}
                                                                    | Available{' '}
                                                                    {
                                                                        schedule.available
                                                                    }
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                                {scheduleError(
                                                    index,
                                                    'schedule_id',
                                                ) && (
                                                    <p className="text-xs text-destructive">
                                                        {
                                                            scheduleError(
                                                                index,
                                                                'schedule_id',
                                                            ) as string
                                                        }
                                                    </p>
                                                )}
                                                {selected && (
                                                    <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                                                        <span>
                                                            Available:{' '}
                                                            {selected.available}
                                                        </span>
                                                        <span className="font-semibold text-primary">
                                                            {formatCurrency(
                                                                selected.displayPrice,
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-3">
                                                {(
                                                    [
                                                        ['pax_adult', 'Adult'],
                                                        ['pax_child', 'Child'],
                                                        [
                                                            'pax_infant',
                                                            'Infant',
                                                        ],
                                                    ] as const
                                                ).map(([field, label]) => (
                                                    <div
                                                        key={field}
                                                        className="space-y-1.5"
                                                    >
                                                        <Label
                                                            htmlFor={`${field}-${index}`}
                                                        >
                                                            {label}
                                                        </Label>
                                                        <Input
                                                            id={`${field}-${index}`}
                                                            type="number"
                                                            min={0}
                                                            max={999}
                                                            value={
                                                                selection[field]
                                                            }
                                                            onChange={(event) =>
                                                                updateSchedule(
                                                                    index,
                                                                    field,
                                                                    Math.max(
                                                                        0,
                                                                        Number(
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        ) || 0,
                                                                    ),
                                                                )
                                                            }
                                                        />
                                                        {scheduleError(
                                                            index,
                                                            field,
                                                        ) && (
                                                            <p className="text-xs text-destructive">
                                                                {
                                                                    scheduleError(
                                                                        index,
                                                                        field,
                                                                    ) as string
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {warning && (
                                                <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
                                                    <AlertCircleIcon className="size-4 shrink-0" />
                                                    <span>{warning}</span>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label>
                                                    Proceed if only some seats
                                                    become available?{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        [true, 'Yes'],
                                                        [false, 'No'],
                                                    ].map(([value, label]) => (
                                                        <Button
                                                            key={String(value)}
                                                            type="button"
                                                            variant={
                                                                selection.accepts_partial_fulfillment ===
                                                                value
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                            size="sm"
                                                            onClick={() => {
                                                                clearErrors();
                                                                setData(
                                                                    'schedules',
                                                                    data.schedules.map(
                                                                        (
                                                                            schedule,
                                                                            rowIndex,
                                                                        ) =>
                                                                            rowIndex ===
                                                                            index
                                                                                ? {
                                                                                      ...schedule,
                                                                                      accepts_partial_fulfillment:
                                                                                          Boolean(
                                                                                              value,
                                                                                          ),
                                                                                      minimum_partial_seats:
                                                                                          value
                                                                                              ? schedule.minimum_partial_seats
                                                                                              : null,
                                                                                  }
                                                                                : schedule,
                                                                    ),
                                                                );
                                                            }}
                                                        >
                                                            {label}
                                                        </Button>
                                                    ))}
                                                </div>
                                                {scheduleError(
                                                    index,
                                                    'accepts_partial_fulfillment',
                                                ) && (
                                                    <p className="text-xs text-destructive">
                                                        {
                                                            scheduleError(
                                                                index,
                                                                'accepts_partial_fulfillment',
                                                            ) as string
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {selection.accepts_partial_fulfillment ===
                                                true && (
                                                <div className="space-y-1.5">
                                                    <Label
                                                        htmlFor={`minimum-partial-seats-${index}`}
                                                    >
                                                        Minimum passengers who
                                                        can still proceed{' '}
                                                        <span className="text-destructive">
                                                            *
                                                        </span>
                                                    </Label>
                                                    <Input
                                                        id={`minimum-partial-seats-${index}`}
                                                        type="number"
                                                        min={1}
                                                        max={999}
                                                        value={
                                                            selection.minimum_partial_seats ??
                                                            ''
                                                        }
                                                        onChange={(event) =>
                                                            updateSchedule(
                                                                index,
                                                                'minimum_partial_seats',
                                                                event.target
                                                                    .value ===
                                                                    ''
                                                                    ? null
                                                                    : Math.max(
                                                                          1,
                                                                          Number(
                                                                              event
                                                                                  .target
                                                                                  .value,
                                                                          ) ||
                                                                              1,
                                                                      ),
                                                            )
                                                        }
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Count only adult and
                                                        child passengers here.
                                                        Infants are excluded.
                                                    </p>
                                                    {scheduleError(
                                                        index,
                                                        'minimum_partial_seats',
                                                    ) && (
                                                        <p className="text-xs text-destructive">
                                                            {
                                                                scheduleError(
                                                                    index,
                                                                    'minimum_partial_seats',
                                                                ) as string
                                                            }
                                                        </p>
                                                    )}
                                                    {minimumPartialSeatsWarning && (
                                                        <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
                                                            <AlertCircleIcon className="size-4 shrink-0" />
                                                            <span>
                                                                {
                                                                    minimumPartialSeatsWarning
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {selection.accepts_partial_fulfillment ===
                                                false && (
                                                <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                                                    Full requested adult and
                                                    child passengers must be
                                                    available before this
                                                    schedule can proceed.
                                                </div>
                                            )}

                                            <Label
                                                htmlFor={`priority-${index}`}
                                                className="flex cursor-pointer items-center gap-2 rounded-md border bg-background p-3"
                                            >
                                                <RadioGroupItem
                                                    id={`priority-${index}`}
                                                    value={String(index)}
                                                />
                                                <span>
                                                    <span className="block text-sm font-medium">
                                                        Priority schedule
                                                    </span>
                                                    <span className="block text-xs font-normal text-muted-foreground">
                                                        Process this schedule
                                                        first.
                                                    </span>
                                                </span>
                                            </Label>
                                        </div>
                                    );
                                })}
                            </RadioGroup>

                            {hasDuplicateSchedules && (
                                <p className="text-sm text-destructive">
                                    Select a different departure for each
                                    schedule.
                                </p>
                            )}
                            {serverError && (
                                <p className="text-sm text-destructive">
                                    {serverError}
                                </p>
                            )}
                        </section>

                        <section className="space-y-3">
                            <Label className="text-sm font-semibold">
                                Customer details
                            </Label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="waiting-contact-name">
                                        Name{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="waiting-contact-name"
                                        value={data.contact_name}
                                        onChange={(event) =>
                                            setData(
                                                'contact_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {errors.contact_name && (
                                        <p className="text-xs text-destructive">
                                            {errors.contact_name}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="waiting-contact-phone">
                                        Phone / WhatsApp{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="waiting-contact-phone"
                                        value={data.contact_phone}
                                        onChange={(event) =>
                                            setData(
                                                'contact_phone',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {errors.contact_phone && (
                                        <p className="text-xs text-destructive">
                                            {errors.contact_phone}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="waiting-contact-email">
                                        Email{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="waiting-contact-email"
                                        type="email"
                                        value={data.contact_email}
                                        onChange={(event) =>
                                            setData(
                                                'contact_email',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {errors.contact_email && (
                                        <p className="text-xs text-destructive">
                                            {errors.contact_email}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="waiting-contact-address">
                                        Address (optional)
                                    </Label>
                                    <Textarea
                                        id="waiting-contact-address"
                                        rows={3}
                                        value={data.contact_address}
                                        onChange={(event) =>
                                            setData(
                                                'contact_address',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {errors.contact_address && (
                                        <p className="text-xs text-destructive">
                                            {errors.contact_address}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>
                </form>

                <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t bg-card px-4 py-3 sm:px-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={closeDialog}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="tour-waiting-list-form"
                        disabled={cannotSubmit}
                    >
                        {processing && (
                            <LoaderCircleIcon className="size-4 animate-spin" />
                        )}
                        Submit Waiting List
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
