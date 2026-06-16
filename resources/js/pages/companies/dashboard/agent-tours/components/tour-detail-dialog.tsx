import { TourMediaImage } from '@/components/tours/tour-media-image';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { FormattedMessage, useIntl } from 'react-intl';

export default function TourDetailDialog({ children, tour }: any) {
    const intl = useIntl();
    const t = tour.tour || tour;

    const destinationParts = [
        t.continent?.name || t.continent,
        t.country?.name || t.country,
        t.destination,
    ].filter(Boolean);

    const destination =
        destinationParts.length > 0 ? destinationParts.join(' - ') : '-';

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl text-primary">
                        {t.name}
                    </DialogTitle>
                    <DialogDescription>
                        <FormattedMessage
                            defaultMessage="Tour Code: {code}"
                            values={{
                                code: (
                                    <span className="font-mono font-bold text-slate-700">
                                        {t.code}
                                    </span>
                                ),
                            }}
                        />
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                        <TourMediaImage
                            media={t.image}
                            fallbackSrc="https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image"
                            alt={t.name}
                            className="w-full h-auto object-cover aspect-video"
                        />
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                <FormattedMessage defaultMessage="Destination" />
                            </h4>
                            <p className="font-semibold text-sm">
                                {destination}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                    <FormattedMessage defaultMessage="Duration" />
                                </h4>
                                <p className="font-semibold text-sm">
                                    {t.duration_days ? (
                                        <FormattedMessage
                                            defaultMessage="{days} Days"
                                            values={{ days: t.duration_days }}
                                        />
                                    ) : (
                                        '-'
                                    )}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                    <FormattedMessage defaultMessage="Status" />
                                </h4>
                                <Badge
                                    variant={
                                        t.status?.toLowerCase() === 'active'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className="uppercase text-[10px]"
                                >
                                    {t.status ||
                                        intl.formatMessage({
                                            defaultMessage: 'Unknown',
                                        })}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                <FormattedMessage defaultMessage="Vendor" />
                            </h4>
                            <p className="font-semibold text-sm">
                                {t.company?.name || '-'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-4">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        <FormattedMessage defaultMessage="Description / Itinerary" />
                    </h4>
                    <div className="bg-slate-50/50 p-4 rounded-lg border border-border text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {t.description ||
                            intl.formatMessage({
                                defaultMessage: 'No description available.',
                            })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
