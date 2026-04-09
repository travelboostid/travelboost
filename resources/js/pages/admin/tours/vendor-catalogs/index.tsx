import type { TourResource } from '@/api/model';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { extractImageSrc } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';

type PageProps = {
  data: {
    data: TourResource[];
    total: number;
  };
};

function AdminTourCard({ tour }: { tour: TourResource }) {
  const { src, srcSet } = extractImageSrc(tour.image as any);

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(tour.showprice ?? 0));

  return (
    <Card className="relative mx-auto flex w-full flex-col overflow-hidden pt-0 h-full">
      <div className="relative">
        <img
          src={src}
          srcSet={srcSet}
          alt={tour.name}
          className="relative z-20 aspect-video w-full object-cover"
        />
        <Badge className="absolute top-2 left-2 z-30" variant="secondary">
          {tour.status}
        </Badge>
      </div>
      <CardHeader className="flex-1 flex flex-col justify-start gap-1 pb-2 px-4">
        <CardTitle className="text-base line-clamp-2 leading-tight pr-1">
          {tour.name}
        </CardTitle>
        <CardDescription className="line-clamp-1 text-xs">
          {tour.destination}
        </CardDescription>
      </CardHeader>
      <div className="px-4 pb-2">
        <div className="text-lg font-bold text-primary">{formattedPrice}</div>
      </div>
      <CardFooter className="flex items-center justify-between border-t px-4 py-2 mt-auto">
        <span className="text-xs text-muted-foreground truncate max-w-[60%]">
          {tour.company?.name ?? 'Unknown Vendor'}
        </span>
        <Badge variant="outline" className="text-[10px]">
          {tour.category?.name ?? 'Uncategorized'}
        </Badge>
      </CardFooter>
    </Card>
  );
}

export default function Page({ data }: PageProps) {
  const [search, setSearch] = useState('');

  const filteredData = data.data.filter((tour) =>
    tour.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminDashboardLayout
      activeMenuIds={['tour', 'tour.vendor-catalogs']}
      openMenuIds={['tour']}
      breadcrumb={[{ title: 'Tour' }, { title: 'Vendor Catalog' }]}
      containerClassName="space-y-4"
    >
      <Head title="Vendor Catalog" />
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
      {filteredData.length ? (
        <div className="grid w-full grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredData.map((tour) => (
            <AdminTourCard key={tour.id} tour={tour} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          No tours found.
        </div>
      )}
    </AdminDashboardLayout>
  );
}
