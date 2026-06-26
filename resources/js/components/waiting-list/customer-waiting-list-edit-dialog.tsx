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
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { LoaderCircleIcon } from 'lucide-react';
import { useEffect, useMemo, type FormEvent } from 'react';

type EditableSchedule = {
    id: number;
    pax_adult: number;
    pax_child: number;
    pax_infant: number;
    available_seats?: number | null;
    tour_schedule?: {
        departure_date: string;
    } | null;
};

type WaitingListEditTarget = {
    id: number;
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    contact_address?: string | null;
    schedules: EditableSchedule[];
};

type EditForm = {
    schedules: Array<{
        id: number;
        pax_adult: number;
        pax_child: number;
        pax_infant: number;
    }>;
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    contact_address: string;
};

type CustomerWaitingListEditDialogProps = {
    waitingList: WaitingListEditTarget | null;
    isOpen: boolean;
    onClose: () => void;
};

function passengerWarning(
    selection: EditForm['schedules'][number],
    availableSeats?: number | null,
) {
    const requiredSeats = selection.pax_adult + selection.pax_child;

    if (requiredSeats < 1) {
        return 'Enter at least one adult or child passenger. Infants are recorded only and do not reduce availability.';
    }

    if (availableSeats === null || availableSeats === undefined) {
        return null;
    }

    if (availableSeats === 0) {
        return null;
    }

    if (requiredSeats <= availableSeats) {
        return `This schedule still has ${availableSeats} seats. Use Book Tour instead, or request more seat-using passengers than currently available.`;
    }

    return null;
}

export function CustomerWaitingListEditDialog({
    waitingList,
    isOpen,
    onClose,
}: CustomerWaitingListEditDialogProps) {
    const { data, setData, patch, processing, errors, reset, clearErrors } =
        useForm<EditForm>({
            schedules: [],
            contact_name: '',
            contact_phone: '',
            contact_email: '',
            contact_address: '',
        });

    useEffect(() => {
        if (!isOpen || !waitingList) {
            return;
        }

        reset();
        clearErrors();
        setData({
            contact_name: waitingList.contact_name,
            contact_phone: waitingList.contact_phone,
            contact_email: waitingList.contact_email,
            contact_address: waitingList.contact_address ?? '',
            schedules: waitingList.schedules.map((schedule) => ({
                id: schedule.id,
                pax_adult: schedule.pax_adult,
                pax_child: schedule.pax_child,
                pax_infant: schedule.pax_infant,
            })),
        });
    }, [isOpen, waitingList, reset, clearErrors, setData]);

    const scheduleAvailabilityMap = useMemo(() => {
        if (!waitingList) {
            return new Map<number, number | null>();
        }

        return new Map(
            waitingList.schedules.map((schedule) => [
                schedule.id,
                schedule.available_seats ?? null,
            ]),
        );
    }, [waitingList]);

    const hasInvalidPassengers = data.schedules.some((selection) =>
        Boolean(
            passengerWarning(
                selection,
                scheduleAvailabilityMap.get(selection.id),
            ),
        ),
    );

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();

        if (!waitingList || hasInvalidPassengers) {
            return;
        }

        patch(`/waiting-lists/${waitingList.id}`, {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    const updateSchedulePax = (
        scheduleId: number,
        field: 'pax_adult' | 'pax_child' | 'pax_infant',
        value: number,
    ) => {
        setData(
            'schedules',
            data.schedules.map((schedule) =>
                schedule.id === scheduleId
                    ? { ...schedule, [field]: value }
                    : schedule,
            ),
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit waiting list</DialogTitle>
                    <DialogDescription>
                        Update your contact details and passenger counts while
                        your request is still in queue.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-3">
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Contact
                        </p>
                        <div className="grid gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="wl-contact-name">Name</Label>
                                <Input
                                    id="wl-contact-name"
                                    value={data.contact_name}
                                    onChange={(event) =>
                                        setData(
                                            'contact_name',
                                            event.target.value,
                                        )
                                    }
                                />
                                {errors.contact_name ? (
                                    <p className="text-xs text-destructive">
                                        {errors.contact_name}
                                    </p>
                                ) : null}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="wl-contact-phone">
                                        Phone
                                    </Label>
                                    <Input
                                        id="wl-contact-phone"
                                        value={data.contact_phone}
                                        onChange={(event) =>
                                            setData(
                                                'contact_phone',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {errors.contact_phone ? (
                                        <p className="text-xs text-destructive">
                                            {errors.contact_phone}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="wl-contact-email">
                                        Email
                                    </Label>
                                    <Input
                                        id="wl-contact-email"
                                        type="email"
                                        value={data.contact_email}
                                        onChange={(event) =>
                                            setData(
                                                'contact_email',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {errors.contact_email ? (
                                        <p className="text-xs text-destructive">
                                            {errors.contact_email}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="wl-contact-address">
                                    Address (optional)
                                </Label>
                                <Textarea
                                    id="wl-contact-address"
                                    rows={2}
                                    value={data.contact_address}
                                    onChange={(event) =>
                                        setData(
                                            'contact_address',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Passengers
                        </p>
                        {waitingList?.schedules.map((schedule, index) => {
                            const formSchedule = data.schedules.find(
                                (item) => item.id === schedule.id,
                            );
                            const departureDate = schedule.tour_schedule
                                ?.departure_date
                                ? dayjs(
                                      schedule.tour_schedule.departure_date,
                                  ).format('DD MMM YYYY')
                                : 'Departure';
                            const warning = formSchedule
                                ? passengerWarning(
                                      formSchedule,
                                      schedule.available_seats,
                                  )
                                : null;

                            return (
                                <div
                                    key={schedule.id}
                                    className="rounded-xl border bg-muted/20 p-3"
                                >
                                    <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                                        Departure date
                                    </p>
                                    <p className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                                        {departureDate}
                                    </p>
                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                        {(
                                            [
                                                ['pax_adult', 'Adults'],
                                                ['pax_child', 'Children'],
                                                ['pax_infant', 'Infants'],
                                            ] as const
                                        ).map(([field, label]) => (
                                            <div
                                                key={field}
                                                className="space-y-1"
                                            >
                                                <Label
                                                    htmlFor={`${schedule.id}-${field}`}
                                                    className="text-xs"
                                                >
                                                    {label}
                                                </Label>
                                                <Input
                                                    id={`${schedule.id}-${field}`}
                                                    type="number"
                                                    min={0}
                                                    value={
                                                        formSchedule?.[field] ??
                                                        0
                                                    }
                                                    onChange={(event) =>
                                                        updateSchedulePax(
                                                            schedule.id,
                                                            field,
                                                            Number(
                                                                event.target
                                                                    .value,
                                                            ),
                                                        )
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {warning ? (
                                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                                            {warning}
                                        </p>
                                    ) : null}
                                    {errors[`schedules.${index}.pax_adult`] ? (
                                        <p className="mt-2 text-xs text-destructive">
                                            {
                                                errors[
                                                    `schedules.${index}.pax_adult`
                                                ]
                                            }
                                        </p>
                                    ) : null}
                                    {errors[`schedules.${index}.id`] ? (
                                        <p className="mt-2 text-xs text-destructive">
                                            {errors[`schedules.${index}.id`]}
                                        </p>
                                    ) : null}
                                </div>
                            );
                        })}
                        {errors.schedules ? (
                            <p className="text-xs text-destructive">
                                {errors.schedules}
                            </p>
                        ) : null}
                        {errors.status ? (
                            <p className="text-xs text-destructive">
                                {errors.status}
                            </p>
                        ) : null}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || hasInvalidPassengers}
                        >
                            {processing ? (
                                <LoaderCircleIcon className="size-4 animate-spin" />
                            ) : (
                                'Save changes'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
