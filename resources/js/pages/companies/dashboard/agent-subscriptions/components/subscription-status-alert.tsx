import { Card, CardContent } from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { AlertTriangleIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import type { AgentSubscriptionPageProps } from '..';

export default function SubscriptionStatusAlert() {
    const { agentSubscription } = usePageProps<AgentSubscriptionPageProps>();

    if (!agentSubscription) {
        return (
            <Card className="overflow-hidden border-amber-500/30 bg-amber-500/5 shadow-sm">
                <CardContent className="flex items-start gap-3 p-4 sm:p-5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        <AlertTriangleIcon className="size-5" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                            <FormattedMessage defaultMessage="No active subscription" />
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            <FormattedMessage defaultMessage="Choose a plan below to activate your agent account and unlock platform features." />
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (agentSubscription.status === 'expired') {
        return (
            <Card className="overflow-hidden border-destructive/30 bg-destructive/5 shadow-sm">
                <CardContent className="flex items-start gap-3 p-4 sm:p-5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
                        <AlertTriangleIcon className="size-5" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                            <FormattedMessage defaultMessage="Subscription expired" />
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            <FormattedMessage defaultMessage="Your plan has ended. Select a package below to renew and restore access." />
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return null;
}
