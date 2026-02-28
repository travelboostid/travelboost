import type { TourResource } from '@/api/model';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import TourCard from './components/TourCard';
import { EmptyTours } from './empty-tours';

type PageProps = {
  username: string;
  data: TourResource[];
};

export default function Page({ username, data }: PageProps) {
  return (
    <CompanyDashboardLayout
      openMenuIds={['vendor-tour-catalogs']}
      activeMenuIds={[`vendor-tour-catalogs.${username}`]}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Tour Catalogs' },
        { title: username },
      ]}
    >
      {data.length ? (
        <div className="grid w-full grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((tour) => (
            <TourCard tour={tour} />
          ))}
        </div>
      ) : (
        <EmptyTours />
      )}
    </CompanyDashboardLayout>
  );
}
