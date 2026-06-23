import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormattedMessage } from 'react-intl';

const triggerClassName =
    'shrink-0 rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-900 shadow-none data-[state=active]:bg-primary data-[state=active]:text-white sm:px-6 sm:text-sm';

export function TourFormTabsList() {
    return (
        <div className="mb-4 max-w-full overflow-x-auto pb-1 [scrollbar-width:thin]">
            <TabsList className="flex h-auto w-max min-w-full gap-2 bg-transparent p-0 sm:min-w-0">
                <TabsTrigger value="tour" className={triggerClassName}>
                    <FormattedMessage defaultMessage="Master" />
                </TabsTrigger>
                <TabsTrigger value="schedule" className={triggerClassName}>
                    <FormattedMessage defaultMessage="Schedule & Price" />
                </TabsTrigger>
                <TabsTrigger value="availability" className={triggerClassName}>
                    <FormattedMessage defaultMessage="Availability" />
                </TabsTrigger>
                <TabsTrigger value="addons" className={triggerClassName}>
                    <FormattedMessage defaultMessage="Add Ons" />
                </TabsTrigger>
            </TabsList>
        </div>
    );
}

export function TourTabFallback() {
    return (
        <div className="space-y-3 rounded-lg border p-4" aria-busy="true">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-24 animate-pulse rounded bg-muted/70" />
        </div>
    );
}
