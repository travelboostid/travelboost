import { index } from '@/actions/App/Http/Controllers/Companies/Dashboard/VendorTourCatalogController';
import type { TourCategoryResource, TourResource } from '@/api/model';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { debugPerfLog } from '@/lib/debug-perf-log';
import { router } from '@inertiajs/react';
import { AlertCircle, SearchIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
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
    const intl = useIntl();
    const [search, setSearch] = useState(filters.search ?? '');
    const [showInactive, setShowInactive] = useState(false);
    const { company } = usePageSharedDataProps();

    // #region agent log
    useEffect(() => {
        debugPerfLog({
            location: 'vendor-tours/index.tsx:mounted',
            message: 'vendor catalog page mounted',
            data: {
                tourCount: data.length,
                scheduleCount: data.reduce(
                    (sum, tour) => sum + (tour.schedules?.length ?? 0),
                    0,
                ),
            },
            hypothesisId: 'B,C',
        });
    }, [data]);
    // #endregion

    useEffect(() => {
        if ((filters.search ?? '') === search) {
            return;
        }

        const timeout = setTimeout(() => {
            const params: any = {};
            if (filters.category) params.category = filters.category;
            if (search.trim()) params.search = search.trim();
            router.get(
                `/companies/${company.username}/dashboard/vendors/${vendor.username}/tours`,
                params,
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 500);
        return () => clearTimeout(timeout);
    }, [
        company.username,
        filters.category,
        filters.search,
        search,
        vendor.username,
    ]);

    const isAgent = company.type === 'agent';
    const isOwnCatalog = company.username === vendor?.username;
    const canCopy = isOwnCatalog || partnership?.status === 'active';
    const activeMenuIds = isOwnCatalog
        ? [isAgent ? 'tours.cats' : 'tours.preview']
        : [`vendor-tours.${username}`];
    const openMenuIds = isOwnCatalog ? ['tours'] : ['vendor-tours'];

    const displayedTours = useMemo(() => {
        const filtered = data.filter((t: any) => {
            const isVendorActive = String(t.status).toLowerCase() === 'active';

            const currentAgentPivot = Array.isArray(t.agents)
                ? t.agents.find((a: any) => a.id === company?.id)?.pivot
                : null;

            const agentStatusData =
                t.agent_status ?? t.pivot?.status ?? currentAgentPivot?.status;
            const agentStatus =
                typeof agentStatusData === 'object' && agentStatusData !== null
                    ? agentStatusData?.value
                    : agentStatusData;
            const isAgentActive =
                String(agentStatus).toLowerCase() === 'active';

            if (showInactive) return true;

            if (isAgent && isOwnCatalog) {
                return isAgentActive;
            }

            return isVendorActive;
        });

        if (isAgent && !isOwnCatalog) {
            filtered.sort((a: any, b: any) => {
                const aActive = String(a.status).toLowerCase() === 'active';
                const bActive = String(b.status).toLowerCase() === 'active';

                if (aActive && !bActive) return -1;
                if (!aActive && bActive) return 1;

                const nameA = String(a.name || '').toLowerCase();
                const nameB = String(b.name || '').toLowerCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
        }

        return filtered;
    }, [data, showInactive, isAgent, isOwnCatalog, company.id]);

    return (
        <CompanyDashboardLayout
            openMenuIds={openMenuIds}
            activeMenuIds={activeMenuIds}
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Tour Catalogs',
                    }),
                },
                { title: username },
            ]}
            containerClassName="bg-slate-50/30 dark:bg-slate-950 min-h-screen pb-20"
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
                        <div className="rounded-2xl border border-red-100 bg-white px-5 py-4 shadow-sm dark:border-red-900/50 dark:bg-slate-900">
                            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40">
                                    <AlertCircle className="h-4 w-4" />
                                </span>
                                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                        <FormattedMessage defaultMessage="Partnership Required" />
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-300">
                                        <FormattedMessage defaultMessage="Active partnership is required to copy tours." />
                                    </span>
                                    <span className="inline-flex w-fit items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-600 dark:bg-red-950/40 dark:text-red-300">
                                        <FormattedMessage
                                            defaultMessage="Status: {status}"
                                            values={{
                                                status:
                                                    partnership?.status ||
                                                    'unregistered',
                                            }}
                                        />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="px-6 space-y-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="relative w-full sm:max-w-xs shrink-0">
                            <SearchIcon
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                            />
                            <input
                                type="text"
                                placeholder={intl.formatMessage({
                                    defaultMessage: 'Search catalog...',
                                })}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border-none bg-white dark:bg-slate-900 px-9 py-2.5 text-sm shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>

                        {isOwnCatalog && (
                            <div className="flex flex-wrap items-center gap-3 w-full">
                                <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                                    <Switch
                                        id="show-inactive"
                                        checked={showInactive}
                                        onCheckedChange={setShowInactive}
                                    />
                                    <Label
                                        htmlFor="show-inactive"
                                        className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                                    >
                                        <FormattedMessage defaultMessage="Show Inactive Tours" />
                                    </Label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1">
                        <button
                            onClick={() =>
                                router.get(
                                    index({
                                        company: company.username,
                                        vendor: username,
                                    }),
                                    search ? { search } : {},
                                    { preserveState: true },
                                )
                            }
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${!filters.category ? 'bg-primary text-primary-foreground shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <FormattedMessage defaultMessage="All Categories" />
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() =>
                                    router.get(
                                        index({
                                            company: company.username,
                                            vendor: username,
                                        }),
                                        {
                                            category: cat.id,
                                            search: search || undefined,
                                        },
                                        { preserveState: true },
                                    )
                                }
                                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${Number(filters.category) === cat.id ? 'bg-primary text-primary-foreground shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
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
