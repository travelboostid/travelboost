import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import { formatIDR } from '@/constants/booking';
import usePageProps from '@/hooks/use-page-props';
import type { AiUsageLogsPageProps } from '..';

export default function Summary() {
    const { summary } = usePageProps<AiUsageLogsPageProps>();

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardDescription>Total Usage Cost</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {formatIDR(summary.total_usage_cost)}
                    </CardTitle>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader>
                    <CardDescription>Total User Cost</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {formatIDR(summary.total_user_cost)}
                    </CardTitle>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader>
                    <CardDescription>Total Profit</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {formatIDR(summary.total_profit)}
                    </CardTitle>
                </CardHeader>
            </Card>
        </div>
    );
}
