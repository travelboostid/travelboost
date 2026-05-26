import { connect } from '@/actions/App/Http/Controllers/Companies/Dashboard/GoogleAccountController';
import { selectOrSetupAccount } from '@/actions/App/Http/Controllers/Companies/Dashboard/GoogleAnalyticsController';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import usePageProps from '@/hooks/use-page-props';
import { Head } from '@inertiajs/react';
import 'dayjs/locale/id';

type AnalyticsPageProps = {
    account: any;
    analytics: any;
};

export default function AnalyticsPage({
    account,
    analytics,
}: AnalyticsPageProps) {
    const { company } = usePageProps();
    return (
        <CompanyDashboardLayout
            containerClassName="w-full flex-1 flex flex-col"
            breadcrumb={[{ title: 'Analytics' }]}
            activeMenuIds={['customers']}
        >
            <Head title="Google Analytics" />
            <div>Hello</div>
            {!account && (
                <a href={connect(company.username).url}>
                    Connect Google Account
                </a>
            )}
            {account && !analytics && (
                <a href={selectOrSetupAccount(company.username).url}>
                    Select or Setup Analytics
                </a>
            )}
        </CompanyDashboardLayout>
    );
}
