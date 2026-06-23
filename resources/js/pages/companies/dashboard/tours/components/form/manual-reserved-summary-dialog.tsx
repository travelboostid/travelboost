import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type DialogProps = {
    context: any;
};

export function ManualReservedSummaryDialog({ context }: DialogProps) {
    const {
        manualReservedSummaryOpen,
        manualReservedSummaryRows,
        setManualReservedSummaryOpen,
        formatManualReservedDateTime,
    } = context;

    return (
        <Dialog
            open={manualReservedSummaryOpen}
            onOpenChange={setManualReservedSummaryOpen}
        >
            <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle>Manual Reserved Saved</DialogTitle>
                    <DialogDescription className="hidden" />
                </DialogHeader>
                <div className="space-y-3">
                    {manualReservedSummaryRows.map((row) => (
                        <div
                            key={row.scheduleId ?? row.departureDate}
                            className="rounded-xl border p-4 text-sm"
                        >
                            <div className="font-medium">
                                Schedule {row.departureDate}
                            </div>
                            <div className="mt-2 space-y-1 text-muted-foreground">
                                <p>
                                    RS value will start counting on{' '}
                                    {formatManualReservedDateTime(row.startAt)}.
                                </p>
                                {row.expiresAt ? (
                                    <p>
                                        It will automatically reset to 0 at{' '}
                                        {formatManualReservedDateTime(
                                            row.expiresAt,
                                        )}
                                        .
                                    </p>
                                ) : (
                                    <p>
                                        It will remain active until it is reset
                                        manually.
                                    </p>
                                )}
                                {row.limitLabel ? (
                                    <p>Limit: {row.limitLabel}</p>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        onClick={() => setManualReservedSummaryOpen(false)}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
