import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { FormattedMessage } from 'react-intl';

type DialogProps = {
    context: any;
};

export function CopyScheduleDialog({ context }: DialogProps) {
    const {
        copyOpen,
        formatDate,
        selectedDates,
        selectedSchedule,
        setCopyOpen,
        setSelectedDates,
        submitCopySchedules,
        tour,
    } = context;

    return (
        <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        <div className="space-y-2">
                            <div className="text-lg font-semibold">
                                <FormattedMessage defaultMessage="Copy Schedule To New Departure Dates" />
                            </div>

                            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                                <div className="font-medium">{tour.name}</div>

                                {selectedSchedule && (
                                    <div className="mt-1 text-muted-foreground">
                                        {formatDate(
                                            selectedSchedule.departure_date,
                                        )}{' '}
                                        {'->'}{' '}
                                        {formatDate(
                                            selectedSchedule.return_date,
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogTitle>
                    <DialogDescription className="hidden" />
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    <div className="border rounded-lg flex justify-center w-fit mx-auto overflow-hidden p-1">
                        <div className="scale-90 origin-top">
                            <Calendar
                                mode="multiple"
                                selected={selectedDates}
                                onSelect={(dates) =>
                                    setSelectedDates(dates || [])
                                }
                                disabled={(date) =>
                                    date <
                                    new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                className="rounded-md"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-auto">
                        {selectedDates.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                <FormattedMessage defaultMessage="No date selected" />
                            </p>
                        )}

                        {selectedDates.map((date, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between border rounded-md px-3 py-2"
                            >
                                <span>{format(date, 'dd MMM yyyy')}</span>

                                <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                        setSelectedDates((prev) =>
                                            prev.filter(
                                                (d) =>
                                                    format(d, 'yyyy-MM-dd') !==
                                                    format(date, 'yyyy-MM-dd'),
                                            ),
                                        )
                                    }
                                >
                                    <FormattedMessage defaultMessage="Remove" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCopyOpen(false)}
                    >
                        <FormattedMessage defaultMessage="Cancel" />
                    </Button>

                    <Button
                        type="button"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        onClick={submitCopySchedules}
                    >
                        <FormattedMessage defaultMessage="Generate" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
