import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import usePageProps from '@/hooks/use-page-props';
import { formatIDR } from '@/lib/utils';
import { IconFolderCode } from '@tabler/icons-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { HandCoins } from 'lucide-react';
import type { WalletPageProps } from '../index';

dayjs.extend(relativeTime);

function EmptyRecentCommissions() {
    return (
        <Empty className="p-4 border-none shadow-none">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <IconFolderCode />
                </EmptyMedia>
                <EmptyTitle>No Commissions Yet</EmptyTitle>
                <EmptyDescription>
                    You haven't received any subscription commissions from your
                    network yet.
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}

function CommissionItem({ commission }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-indigo-50 text-indigo-600">
                    <HandCoins className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground capitalize">
                        {commission.tier.replace('_', ' ')} Bonus
                    </p>
                    <p className="text-xs text-muted-foreground">
                        From {commission.company_name} •{' '}
                        {dayjs(commission.created_at).fromNow()}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-semibold text-sm text-indigo-600">
                    +{formatIDR(Number(commission.commission_amount))}
                </p>
                <p className="text-xs text-muted-foreground">
                    {Number(commission.commission_rate)}% Rate
                </p>
            </div>
        </div>
    );
}

export default function RecentCommissions() {
    const { recent_commissions } = usePageProps<WalletPageProps>();

    return (
        <Card className="bg-linear-to-t from-secondary/5 to-card shadow-xs dark:bg-card border-slate-200 h-full">
            <CardHeader>
                <CardTitle className="text-lg">Recent Commissions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    {(!recent_commissions ||
                        recent_commissions.length === 0) && (
                        <EmptyRecentCommissions />
                    )}
                    {recent_commissions?.map((comm: any) => (
                        <CommissionItem key={comm.id} commission={comm} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
