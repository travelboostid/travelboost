import type { TourResource } from '@/api/model';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { extractDocumentUrl } from '@/lib/utils';

export default function ViewBrochure({ tour }: { tour: TourResource }) {
  console.log(tour);
  const url = extractDocumentUrl(tour.document as any);
  return (
    <DashboardLayout
      openMenuIds={['tours']}
      activeMenuIds={['tours.index']}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Tours', url: '/dashboard/tours' },
        { title: tour.name },
        { title: 'Brochure' },
      ]}
      containerClassName="flex-1 flex flex-col p-4"
    >
      <iframe src={url} className="h-full w-full rounded-lg border" />
    </DashboardLayout>
  );
}
