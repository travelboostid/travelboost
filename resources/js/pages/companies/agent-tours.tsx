import type { Company, TourCategoryResource, TourResource } from '@/api/model';
import TenantLayout from '@/components/layouts/tenant-layout';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';
import TourCard from './dashboard/vendor-tours/components/TourCard';
import { EmptyTours } from './empty-tours';

export type AgentTour = {
  id: number;
  company_id: number;
  category_id?: number;
  company: Company;
  tour: TourResource;
};

type ArticlePageProps = {
  data: AgentTour[];
  company: Company;
  vendor: Company;
  username: string;
  categories: TourCategoryResource[];
  phone: string;
};

export default function Page({ data, categories }: ArticlePageProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<number | ''>('');

  const filteredData = data.filter((item) => {
    const matchSearch = item.tour.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchCategory =
      category === '' ? true : item.category_id === category;
    return matchSearch && matchCategory;
  });

  return (
    <TenantLayout>
      <div className="px-4 mt-4">
        <div className="mx-auto relative w-full max-w-md">
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
      <div className="flex gap-2 overflow-x-auto pb-4 pt-4 px-4 justify-center">
        <button
          onClick={() => setCategory('')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition
          ${
            category === ''
              ? 'bg-primary text-white'
              : 'bg-muted hover:bg-muted/70'
          }`}
        >
          Semua
        </button>

        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
            active:scale-95
            ${
              category === cat.id
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-muted hover:bg-muted/70'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {filteredData.length ? (
        <div className="space-y-4 p-4">
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredData.map((item) => (
              <TourCard key={item.id} tour={item.tour} fromLogin={false} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyTours />
      )}
    </TenantLayout>
  );
}
