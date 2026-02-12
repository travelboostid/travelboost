import DashboardLayout from '@/components/layouts/dashboard-layout';
import type { Tour } from './components/TourCard';
import TourCard from './components/TourCard';
import { EmptyTours } from './empty-tours';

type PageProps = {
  username: string;
  data: {
    data: Tour[];
  };
};

export default function Page({ username, data }: PageProps) {
  return (
    <DashboardLayout
      openMenuIds={['vendor-tour-catalogs']}
      activeMenuIds={[`vendor-tour-catalogs.${username}`]}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Tour Catalogs' },
        { title: username },
      ]}
    >
      {data.data.length ? (
        <div className="grid w-full grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.data.map((tour) => (
            <TourCard tour={tour} />
          ))}
        </div>
      ) : (
        <EmptyTours />
      )}
    </DashboardLayout>
  );
}
