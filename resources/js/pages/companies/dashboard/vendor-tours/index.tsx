import { index } from '@/actions/App/Http/Controllers/Companies/Dashboard/VendorTourCatalogController';
import type { TourCategoryResource, TourResource } from '@/api/model';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { router } from '@inertiajs/react';
import { AlertCircle, SearchIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import TourCard from './components/TourCard';
import VendorPartnershipRegistrationButton from './components/vendor-partnership-register-button';
import { EmptyTours } from './empty-tours';

type PageProps = {
  username: string;
  categories: TourCategoryResource[];
  filters: { category?: string; search?: string };
  data: TourResource[];
  vendor: any;
  partnership: any;
};

export default function Page({
  username,
  data,
  categories,
  filters,
  vendor,
  partnership,
}: PageProps) {
  const [search, setSearch] = useState(filters.search ?? '');
  const [showVendorInactive, setShowVendorInactive] = useState(false);
  const [showAgentInactive, setShowAgentInactive] = useState(false);
  const { company } = usePageSharedDataProps();

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params: any = {};
      if (filters.category) params.category = filters.category;
      if (search) params.search = search;
      router.get(
        index({ company: company.username, vendor: vendor.username }),
        params,
        { preserveState: true, replace: true },
      );
    }, 500);
    return () => clearTimeout(timeout);
  }, [company.username, filters.category, search, vendor.username]);

  const isAgent = company.type === 'agent';
  const isOwnCatalog = company.username === vendor?.username;
  const canCopy = isOwnCatalog || partnership?.status === 'active';

  const displayedTours = useMemo(() => {
    return data.filter((t: any) => {
      const isVendorActive = t.status === 'active';
      const isAgentActive = t.agent_status === 'active' || !t.has_copied;

      const vendorPass = showVendorInactive || isVendorActive;

      const agentPass = isOwnCatalog
        ? showAgentInactive || isAgentActive
        : true;

      return vendorPass && agentPass;
    });
  }, [data, showVendorInactive, showAgentInactive, isOwnCatalog]);

  return (
    <CompanyDashboardLayout
      openMenuIds={['vendor-tours']}
      activeMenuIds={[`vendor-tours.${username}`]}
      breadcrumb={[{ title: 'Tour Catalogs' }, { title: username }]}
      containerClassName="bg-slate-50/30 min-h-screen pb-20"
      applet={
        isAgent && !isOwnCatalog ? (
          <VendorPartnershipRegistrationButton
            vendor={vendor}
            partnership={partnership}
          />
        ) : undefined
      }
    >
      <div className="max-w-[1600px] mx-auto space-y-4 pt-4">
        {isAgent && !isOwnCatalog && !canCopy && (
          <div className="px-6">
            <Alert
              variant="destructive"
              className="bg-white border-red-100 rounded-2xl shadow-sm"
            >
              <AlertCircle className="h-5 w-5 text-red-500" />
              <AlertTitle className="text-red-600 font-bold">
                Partnership Required
              </AlertTitle>
              <AlertDescription className="text-slate-500 text-sm">
                Active partnership is required to copy tours. Your status:{' '}
                {partnership?.status || 'unregistered'}.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="px-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
              <div className="relative w-full sm:max-w-xs">
                <SearchIcon
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border-none bg-white px-9 py-2.5 text-sm shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm ring-1 ring-slate-200">
                <Switch
                  id="show-inactive"
                  checked={showVendorInactive}
                  onCheckedChange={setShowVendorInactive}
                />
                <Label
                  htmlFor="show-inactive"
                  className="text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Show Vendor Inactive Tours
                </Label>
              </div>

              {isAgent && isOwnCatalog && (
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm ring-1 ring-slate-200">
                  <Switch
                    id="show-agent-inactive"
                    checked={showAgentInactive}
                    onCheckedChange={setShowAgentInactive}
                  />
                  <Label
                    htmlFor="show-agent-inactive"
                    className="text-xs font-bold text-slate-600 cursor-pointer"
                  >
                    Show My Inactive Tours
                  </Label>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() =>
                  router.get(
                    index({ company: company.username, vendor: username }),
                    search ? { search } : {},
                    { preserveState: true },
                  )
                }
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!filters.category ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    router.get(
                      index({ company: company.username, vendor: username }),
                      { category: cat.id, search: search || undefined },
                      { preserveState: true },
                    )
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${Number(filters.category) === cat.id ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {displayedTours.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayedTours.map((tour) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  type={company.type}
                  partnership={partnership}
                  isOwnCatalog={isOwnCatalog}
                />
              ))}
            </div>
          ) : (
            <EmptyTours />
          )}
        </div>
      </div>
    </CompanyDashboardLayout>
  );
}
