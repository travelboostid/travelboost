import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FormattedMessage, useIntl } from 'react-intl';
import type { DocumentDetail } from '../booking-index-types';

export function BookingIndexDocumentsDialog({
    bookingNumber,
    documents,
    onOpenChange,
}: {
    bookingNumber: string | null;
    documents: DocumentDetail[];
    onOpenChange: (open: boolean) => void;
}) {
    const intl = useIntl();

    return (
        <Dialog open={Boolean(bookingNumber)} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        <FormattedMessage defaultMessage="Travel Documents" />
                    </DialogTitle>
                    <DialogDescription>
                        {bookingNumber
                            ? intl.formatMessage(
                                  {
                                      defaultMessage:
                                          'Documents for booking {bookingNumber}.',
                                  },
                                  { bookingNumber },
                              )
                            : intl.formatMessage({
                                  defaultMessage: 'Submitted travel documents.',
                              })}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    {documents.length > 0 ? (
                        documents.map((document, index) => (
                            <div
                                key={`${document.passenger_name}-${index}`}
                                className="rounded-lg border bg-muted/30 p-4 text-sm"
                            >
                                <p className="font-semibold">
                                    {document.passenger_name}
                                </p>
                                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                                    <div className="rounded-md border bg-background p-3">
                                        <p className="font-semibold text-muted-foreground">
                                            <FormattedMessage defaultMessage="Passport" />
                                        </p>
                                        {document.passport_file_url ? (
                                            <a
                                                href={
                                                    document.passport_file_url
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-1 block truncate font-semibold text-primary hover:underline"
                                            >
                                                {document.passport_file_name ??
                                                    intl.formatMessage({
                                                        defaultMessage:
                                                            'View passport',
                                                    })}
                                            </a>
                                        ) : (
                                            <p className="mt-1 text-muted-foreground">
                                                -
                                            </p>
                                        )}
                                    </div>
                                    <div className="rounded-md border bg-background p-3">
                                        <p className="font-semibold text-muted-foreground">
                                            <FormattedMessage defaultMessage="Visa" />
                                        </p>
                                        {document.visa_file_url ? (
                                            <a
                                                href={document.visa_file_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-1 block truncate font-semibold text-primary hover:underline"
                                            >
                                                {document.visa_file_name ??
                                                    intl.formatMessage({
                                                        defaultMessage:
                                                            'View visa',
                                                    })}
                                            </a>
                                        ) : (
                                            <p className="mt-1 text-muted-foreground">
                                                -
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                            <FormattedMessage defaultMessage="No submitted documents are available." />
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
