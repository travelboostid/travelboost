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
import { toast } from 'sonner';

type DialogProps = {
    context: any;
};

export function ManualReservedEditorDialog({ context }: DialogProps) {
    const {
        _buildAvailabilityPayloadRow,
        availability,
        formatManualReservedDateTime,
        formatManualReservedSummaryTime,
        getManualReservedExpiresAt,
        hasManualReservedLimit,
        manualReservedEditorOpen,
        manualReservedEditorRow,
        manualReservedEditorStartDate,
        manualReservedEditorStartTime,
        manualReservedLimitDescription,
        manualReservedLimitLabel,
        setManualReservedEditorOpen,
        setManualReservedEditorStartDate,
        setManualReservedEditorStartTime,
        setManualReservedSummaryOpen,
        setManualReservedSummaryRows,
        submitAvailabilityPayload,
    } = context;

    return (
        <Dialog
            open={manualReservedEditorOpen}
            onOpenChange={setManualReservedEditorOpen}
        >
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Set Manual Reserved Start Time</DialogTitle>
                    <DialogDescription className="hidden" />
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                        {manualReservedEditorRow
                            ? `Schedule ${manualReservedEditorRow.departureDate}. ${manualReservedLimitDescription}.`
                            : 'Select a start date and time for this manual reserved value.'}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="manual_reserved_start_date">
                                Start Date
                            </Label>
                            <Input
                                id="manual_reserved_start_date"
                                type="date"
                                value={manualReservedEditorStartDate}
                                onChange={(event) =>
                                    setManualReservedEditorStartDate(
                                        event.target.value,
                                    )
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="manual_reserved_start_time">
                                Start Time
                            </Label>
                            <Input
                                id="manual_reserved_start_time"
                                type="time"
                                value={manualReservedEditorStartTime}
                                onChange={(event) =>
                                    setManualReservedEditorStartTime(
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        RS value will start counting on{' '}
                        {formatManualReservedSummaryTime(
                            manualReservedEditorStartDate,
                            manualReservedEditorStartTime,
                        )}
                        {hasManualReservedLimit
                            ? ` and will automatically reset to 0 at ${formatManualReservedDateTime(
                                  getManualReservedExpiresAt(
                                      manualReservedEditorStartDate,
                                      manualReservedEditorStartTime,
                                  ),
                              )}.`
                            : ' and will remain active until it is reset manually.'}
                    </p>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setManualReservedEditorOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={() => {
                            if (!manualReservedEditorRow) {
                                return;
                            }

                            const selectedAvailability = availability.find(
                                (row) =>
                                    row.schedule_id ===
                                    manualReservedEditorRow.scheduleId,
                            );

                            if (!selectedAvailability) {
                                toast.error('Availability row was not found.');

                                return;
                            }

                            submitAvailabilityPayload(
                                [
                                    _buildAvailabilityPayloadRow(
                                        selectedAvailability,
                                        manualReservedEditorStartDate,
                                        manualReservedEditorStartTime,
                                    ),
                                ],
                                {
                                    onSuccess: () => {
                                        setManualReservedSummaryRows([
                                            {
                                                scheduleId:
                                                    manualReservedEditorRow.scheduleId,
                                                departureDate:
                                                    manualReservedEditorRow.departureDate,
                                                startAt: `${manualReservedEditorStartDate} ${manualReservedEditorStartTime}`,
                                                expiresAt:
                                                    getManualReservedExpiresAt(
                                                        manualReservedEditorStartDate,
                                                        manualReservedEditorStartTime,
                                                    ),
                                                originalAvailable: Number(
                                                    selectedAvailability.available +
                                                        selectedAvailability.RS,
                                                ),
                                                limitLabel:
                                                    manualReservedLimitLabel,
                                            },
                                        ]);
                                        setManualReservedEditorOpen(false);
                                        setManualReservedSummaryOpen(true);
                                    },
                                },
                            );
                        }}
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
