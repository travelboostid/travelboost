import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import usePageProps from '@/hooks/use-page-props';
import { Head } from '@inertiajs/react';
import 'dayjs/locale/id';
import { useIntl } from 'react-intl';
import { GoogleAccountUnlinked } from './components/google-account-unlinked';
import { GoogleAnalyticsUnlinked } from './components/google-analytics-unlinked';
import RealtimeDeviceBreakdown from './components/realtime-device-breakdown';
import RealtimeEvents from './components/realtime-events';
import RealtimeOverview from './components/realtime-overview';
import RealtimeTopCountries from './components/realtime-top-countries';
import RealtimeTopPages from './components/realtime-top-pages';

export type AnalyticsPageProps = {
    account: any;
    analytics: any;
    insights: any;
    realtimeInsights: any;
};

export default function AnalyticsPage({
    account,
    analytics,
    insights,
    realtimeInsights,
}: AnalyticsPageProps) {
    const intl = useIntl();
    const { company, ...other } = usePageProps();
    console.log(insights);
    console.log('rt', realtimeInsights);
    console.log(other);
    return (
        <CompanyDashboardLayout
            containerClassName="p-4"
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Analytics',
                    }),
                },
            ]}
            activeMenuIds={['customers']}
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Google Analytics',
                })}
            />
            {!account && <GoogleAccountUnlinked />}
            {account && !analytics && <GoogleAnalyticsUnlinked />}
            {realtimeInsights && (
                <div className="grid grid-cols-2 gap-4">
                    <RealtimeOverview className="col-span-2" />
                    <RealtimeDeviceBreakdown />
                    <RealtimeTopPages />
                    <RealtimeTopCountries />
                    <RealtimeEvents />
                </div>
            )}
        </CompanyDashboardLayout>
    );
}
