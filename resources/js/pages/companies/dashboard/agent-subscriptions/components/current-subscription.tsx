import { Card, CardContent } from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import dayjs from 'dayjs';
import { Calendar, CheckCircle2, DollarSign } from 'lucide-react';
import type { AgentSubscriptionPageProps } from '..';

export function CurrentSubscription() {
  const { agentSubscription } = usePageProps<AgentSubscriptionPageProps>();

  return (
    <Card>
      <CardContent className="space-y-6">
        {/* Subscription Details Grid */}
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Status
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {agentSubscription.status.charAt(0).toUpperCase() +
                agentSubscription.status.slice(1)}
            </p>
          </div>

          {/* Billing Period */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Calendar className="h-4 w-4 text-primary" />
              Subscription Period
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {dayjs(agentSubscription.ended_at).format('MMMM D, YYYY')}
            </p>
            <p className="text-xs text-slate-500">
              from {dayjs(agentSubscription.started_at).format('MMMM D, YYYY')}
            </p>
          </div>

          {/* Billing Amount */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <DollarSign className="h-4 w-4 text-primary" />
              Billing Amount
            </div>
            <p className="text-lg font-semibold text-slate-900">
              IDR {agentSubscription.package.price}
            </p>
            <p className="text-xs text-slate-500">
              {agentSubscription.package.duration_months} months
            </p>
          </div>
        </div>
      </CardContent>
      {/* <CardFooter className="flex gap-2">
        <CardAction>
          <Button variant="outline" onClick={onExtendClick} className="w-full">
            Extend/Renew Subscription
          </Button>
        </CardAction>
      </CardFooter> */}
    </Card>
  );
}
