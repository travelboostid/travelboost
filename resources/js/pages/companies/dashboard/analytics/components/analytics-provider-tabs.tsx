import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import usePageProps from '@/hooks/use-page-props';
import { index as googleAnalyticsIndex } from '@/routes/companies/dashboard/analytics';
import { index as metaAnalyticsIndex } from '@/routes/companies/dashboard/analytics/meta';
import { Link } from '@inertiajs/react';
import {
    IconBrandFacebook,
    IconBrandGoogleAnalytics,
} from '@tabler/icons-react';
import { FormattedMessage } from 'react-intl';

type AnalyticsProviderTabsProps = {
    activeProvider: 'google' | 'meta';
};

export function AnalyticsProviderTabs({
    activeProvider,
}: AnalyticsProviderTabsProps) {
    const { company } = usePageProps();

    return (
        <Tabs value={activeProvider} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="google" asChild>
                    <Link
                        href={googleAnalyticsIndex(company.username).url}
                        preserveScroll
                    >
                        <IconBrandGoogleAnalytics className="size-4" />
                        <FormattedMessage defaultMessage="Google Analytics" />
                    </Link>
                </TabsTrigger>
                <TabsTrigger value="meta" asChild>
                    <Link
                        href={metaAnalyticsIndex(company.username).url}
                        preserveScroll
                    >
                        <IconBrandFacebook className="size-4 text-[#1877F2]" />
                        <FormattedMessage defaultMessage="Meta Pixel" />
                    </Link>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
