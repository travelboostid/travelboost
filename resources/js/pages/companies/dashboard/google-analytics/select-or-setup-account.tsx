import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import usePageProps from '@/hooks/use-page-props';
import { Head } from '@inertiajs/react';
import 'dayjs/locale/id';

import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

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
    accounts: any[];
};

export default function SelectOrSetupAccountPage({
    accounts,
}: SelectOrSetupAccountPageProps) {
    console.log(accounts);
    const { company } = usePageProps();
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
                    {accounts.flatMap((account) => {
                        const accountRowSpan = getAccountRowCount(account);

                        let accountRendered = false;

                        return account.properties.flatMap((property: any) => {
                            const propertyRowSpan =
                                getPropertyRowCount(property);

                            let propertyRendered = false;

                            return property.streams.map((stream: any) => {
                                const row = (
                                    <TableRow
                                        key={`${account.id}-${property.id}-${stream.id}`}
                                    >
                                        {!accountRendered && (
                                            <TableCell
                                                rowSpan={accountRowSpan}
                                                className="align-top"
                                            >
                                                <div className="font-medium">
                                                    {account.display_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {account.id}
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
                                            <Button size="sm">Select</Button>
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
