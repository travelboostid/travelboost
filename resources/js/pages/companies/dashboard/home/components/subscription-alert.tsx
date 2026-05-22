import {
    Alert,
    AlertAction,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import usePageProps from '@/hooks/use-page-props';
import { show } from '@/routes/companies/dashboard/agent-subscriptions';
import { Link } from '@inertiajs/react';
import {
    AlertTriangleIcon,
    CheckCircleIcon,
    ChevronRightIcon,
} from 'lucide-react';

export default function SubscriptionAlert() {
    const { agentSubscription, company } = usePageProps<any>();

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    if (!agentSubscription) {
        return (
            <Alert
                variant="default"
                className="border-warning/20 bg-warning/5 text-warning-foreground"
            >
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertTitle className="font-bold">
                    Your subscription is not active.
                </AlertTitle>
                <AlertDescription className="text-sm opacity-90">
                    You currently do not have an active subscription. Please
                    select a subscription plan to continue using our services
                    without interruption.
                </AlertDescription>
                <AlertAction className="pt-2">
                    <Link href={show({ company: company.username })}>
                        <Button
                            size="sm"
                            variant="destructive"
                            className="font-semibold shadow-sm"
                        >
                            View Subscription Plans
                            <ChevronRightIcon className="ml-1 h-4 w-4" />
                        </Button>
                    </Link>
                </AlertAction>
            </Alert>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-primary w-full">
            <div className="flex items-center gap-3 mb-3 sm:mb-0">
                <CheckCircleIcon className="h-5 w-5" />
                <div className="text-sm">
                    <span className="font-bold">Subscription Active</span>
                    <span className="mx-2 hidden sm:inline text-primary/60">
                        •
                    </span>
                    <span className="opacity-90 block sm:inline mt-1 sm:mt-0">
                        Valid until{' '}
                        <span className="font-semibold">
                            {formatDate(agentSubscription.ended_at)}
                        </span>
                    </span>
                </div>
            </div>
            <Link href={show({ company: company.username })}>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-primary/30 text-primary hover:bg-primary/10 font-semibold text-xs"
                >
                    Manage Subscription
                    <ChevronRightIcon className="ml-1 h-3 w-3" />
                </Button>
            </Link>
        </div>
    );
}
