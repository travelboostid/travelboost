'use client';

import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { GlobeIcon } from 'lucide-react';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import { FormattedMessage } from 'react-intl';
import type { AnalyticsPageProps } from '..';

type RealtimeTopCountriesProps = DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
>;

export default function RealtimeTopCountries(props: RealtimeTopCountriesProps) {
    const { realtimeInsights } = usePageProps<AnalyticsPageProps>();

    return (
        <Card {...props}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <GlobeIcon className="h-5 w-5 text-chart-4" />
                    <FormattedMessage defaultMessage="Top Countries" />
                </CardTitle>
                <CardDescription>
                    <FormattedMessage defaultMessage="User location breakdown" />
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {realtimeInsights.countries.map((country: any) => (
                        <div
                            key={country.name}
                            className="flex items-center justify-between"
                        >
                            <p className="font-medium text-foreground">
                                {country.name}
                            </p>
                            <Badge variant="secondary">{country.value}</Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
