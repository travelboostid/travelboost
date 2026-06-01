import type { TourResource } from '@/api/model';
import { extractDocumentUrl } from '@/lib/utils';

export default function ViewBrochure({ tour }: { tour: TourResource }) {
    const url = extractDocumentUrl(tour.document as any);

    return (
        <iframe
            src={url}
            title={`${tour.name} brochure`}
            className="h-screen w-screen border-0"
        />
    );
}
