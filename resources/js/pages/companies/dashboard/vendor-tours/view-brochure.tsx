import type { TourResource } from '@/api/model';
import { extractDocumentUrl } from '@/lib/utils';
import { useIntl } from 'react-intl';

export default function ViewBrochure({ tour }: { tour: TourResource }) {
    const intl = useIntl();
    const url = extractDocumentUrl(tour.document as any);

    return (
        <iframe
            src={url}
            title={intl.formatMessage(
                { defaultMessage: '{tourName} brochure' },
                { tourName: tour.name },
            )}
            className="h-screen w-screen border-0"
        />
    );
}
