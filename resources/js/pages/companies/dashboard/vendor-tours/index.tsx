import { index } from '@/actions/App/Http/Controllers/Companies/Dashboard/VendorTourCatalogController';
import type { TourCategoryResource, TourResource } from '@/api/model';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { router } from '@inertiajs/react';
import { SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import TourCard from './components/TourCard';
import { EmptyTours } from './empty-tours';

type PageProps = {
  username: string;
  phone: string;
  categories: TourCategoryResource[];
  filters: {
    category?: string;
    search?: string;
  };
  data: TourResource[];
};

//export default function Page({ username, data }: PageProps) {
export default function Page({
  username,
  data,
  categories,
  filters,
}: PageProps) {
  const [search, setSearch] = useState(filters.search ?? '');
  const { company } = usePageSharedDataProps();
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.get(
        index({ company: company.username, vendor: username }),
        {
          category: filters.category,
          search: search || undefined,
        },
        {
          preserveState: true,
          replace: true, // supaya URL tidak numpuk di history
        },
      );
    }, 500); // 500ms delay

    return () => clearTimeout(timeout);
  }, [company.username, filters.category, search, username]);
  /*const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    router.get(
      `/dashboard/vendors/${username}/tours`,
      {
        category: filters.category,
        search: search || undefined,
      },
      { preserveState: true }
    );
  };*/

  //02032026
  //const waNumber = data.data[0]?.user_phone; // ambil dari tour pertama (contoh)
  //const waNumber = "012232322";
  return (
    <CompanyDashboardLayout
      openMenuIds={['vendor-tour-catalogs']}
      activeMenuIds={[`vendor-tour-catalogs.${username}`]}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Tour Catalogs' },
        { title: username },
      ]}
      containerClassName="space-y-4"
    >
      <div className="px-4 mt-4">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Cari tour..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border bg-background px-4 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <SearchIcon
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 ml-4">
        {/* Tombol Semua */}
        <button
          onClick={() =>
            router.get(
              index({ company: company.username, vendor: username }),
              {
                search: search || undefined,
              },
              { preserveState: true },
            )
          }
          className={`px-4 py-2 rounded-full text-sm font-medium transition
          ${
            !filters.category
              ? 'bg-primary text-white'
              : 'bg-muted hover:bg-muted/70'
          }`}
        >
          Semua
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() =>
              router.get(
                index({ company: company.username, vendor: username }),
                { category: category.id, search: search || undefined },
                { preserveState: true },
              )
            }
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
            active:scale-95
            ${
              Number(filters.category) === category.id
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-muted hover:bg-muted/70'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
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
