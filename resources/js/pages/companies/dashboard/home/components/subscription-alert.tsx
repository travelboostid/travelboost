import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import usePageProps from '@/hooks/use-page-props';
import { show } from '@/routes/company/agent-subscriptions';
import { Link } from '@inertiajs/react';
import { AlertTriangleIcon, ChevronRightIcon } from 'lucide-react';
import type { HomePageProps } from '..';

export default function SubscriptionAlert() {
  const { agentSubscription, company } = usePageProps<HomePageProps>();

  if (!agentSubscription) {
    return (
      <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
        <AlertTriangleIcon />
        <AlertTitle>Your subscription is not active.</AlertTitle>
        <AlertDescription>
          You currently do not have an active subscription. Please select a
          subscription plan to continue using our services without interruption.
        </AlertDescription>
        <AlertAction className="pt-2">
          <Link href={show({ company: company.username })}>
            <Button size="sm" variant="destructive">
              View Subscription Plans
              <ChevronRightIcon />
            </Button>
          </Link>
        </AlertAction>
      </Alert>
    );
  }
  return null;
}
