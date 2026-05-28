import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import usePageProps from '@/hooks/use-page-props';
import { Head, router } from '@inertiajs/react';
import 'dayjs/locale/id';

import { selectAccount } from '@/actions/App/Http/Controllers/Companies/Dashboard/GoogleAnalyticsController';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useState } from 'react';
import { toast } from 'sonner';

function getPropertyRowCount(property: any) {
    return Math.max(property.streams?.length ?? 0, 1);
}

function getAccountRowCount(account: any) {
    return account.properties.reduce(
        (sum: number, property: any) => sum + getPropertyRowCount(property),
        0,
    );
}

type SelectOrSetupAccountPageProps = {
    googleAccount: any;
    analyticAccounts: any[];
};

export default function SelectOrSetupAccountPage({
    googleAccount,
    analyticAccounts,
}: SelectOrSetupAccountPageProps) {
    const [loading, setLoading] = useState(false);
    const { company } = usePageProps();

    const handleSelect = (gaAccount: any, gaProperty: any, gaStream: any) => {
        router.post(
            selectAccount(company.username),
            {
                company_google_account_id: googleAccount.id,
                ga_account_id: gaAccount.id,
                property_id: gaProperty.id,
                data_stream_id: gaStream.id,
                measurement_id: gaStream.measurement_id,
                website_url: gaStream.default_uri || '-',
                timezone: gaProperty.time_zone,
                currency: gaProperty.currency_code,
            },
            {
                onBefore: () => setLoading(true),
                onSuccess: () => {
                    toast.success(
                        'Google analytics property successfully connected!',
                    );
                    router.reload();
                },
                onFinish: () => setLoading(false),
            },
        );
    };
    return (
        <CompanyDashboardLayout
            containerClassName="w-full flex-1 flex flex-col"
            breadcrumb={[{ title: 'Analytics' }]}
            activeMenuIds={['customers']}
        >
            <Head title="Google Analytics" />
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Stream</TableHead>
                        <TableHead>Measurement ID</TableHead>
                        <TableHead>Website</TableHead>
                        <TableHead>Timezone</TableHead>
                        <TableHead className="w-[120px]">Action</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {analyticAccounts.flatMap((gaAccount) => {
                        const accountRowSpan = getAccountRowCount(gaAccount);

                        let accountRendered = false;

                        return gaAccount.properties.flatMap((property: any) => {
                            const propertyRowSpan =
                                getPropertyRowCount(property);

                            let propertyRendered = false;

                            return property.streams.map((stream: any) => {
                                const row = (
                                    <TableRow
                                        key={`${gaAccount.id}-${property.id}-${stream.id}`}
                                    >
                                        {!accountRendered && (
                                            <TableCell
                                                rowSpan={accountRowSpan}
                                                className="align-top"
                                            >
                                                <div className="font-medium">
                                                    {gaAccount.display_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {gaAccount.id}
                                                </div>
                                            </TableCell>
                                        )}

                                        {!propertyRendered && (
                                            <TableCell
                                                rowSpan={propertyRowSpan}
                                                className="align-top"
                                            >
                                                <div>
                                                    {property.display_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {property.id}
                                                </div>
                                            </TableCell>
                                        )}

                                        <TableCell>
                                            {stream.display_name || '-'}
                                        </TableCell>

                                        <TableCell className="font-mono">
                                            {stream.measurement_id || '-'}
                                        </TableCell>

                                        <TableCell>
                                            {stream.default_uri || '-'}
                                        </TableCell>

                                        <TableCell>
                                            {property.time_zone}
                                        </TableCell>

                                        <TableCell>
                                            <Button
                                                disabled={loading}
                                                size="sm"
                                                onClick={() =>
                                                    handleSelect(
                                                        gaAccount,
                                                        property,
                                                        stream,
                                                    )
                                                }
                                            >
                                                Select
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );

                                accountRendered = true;
                                propertyRendered = true;

                                return row;
                            });
                        });
                    })}
                </TableBody>
            </Table>
        </CompanyDashboardLayout>
    );
}
