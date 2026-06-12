import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Head } from '@inertiajs/react';
import { useIntl } from 'react-intl';
import { ChartAreaInteractive } from './components/chart-area-interactive';
import { SectionCards } from './components/section-cards';

export default function Home() {
    const intl = useIntl();

    return (
        <CompanyDashboardLayout
            activeMenuIds={[`home`]}
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Dashboard',
                    }),
                    url: '/dashboard',
                },
            ]}
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Preferences',
                })}
            />
            <div className="grid grid-cols-1 gap-4 p-4">
                <SectionCards />
                <ChartAreaInteractive />
            </div>
        </CompanyDashboardLayout>
    );
}
