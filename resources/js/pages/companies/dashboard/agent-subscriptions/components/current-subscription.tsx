import { Card, CardContent } from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import dayjs from 'dayjs';
import { Calendar, CheckCircle2, Package } from 'lucide-react';
import type { AgentSubscriptionPageProps } from '..';

export function CurrentSubscription() {
  const { agentSubscription } = usePageProps<AgentSubscriptionPageProps>();

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Status
            </div>
            <p className="text-lg font-bold text-slate-900">
              {agentSubscription.status.charAt(0).toUpperCase() +
                agentSubscription.status.slice(1)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Calendar className="h-4 w-4 text-blue-600" />
              Validity Period
            </div>
            <p className="text-lg font-bold text-slate-900">
              {dayjs(agentSubscription.ended_at).format('DD MMM YYYY')}
            </p>
            <p className="text-sm text-slate-500">
              Since {dayjs(agentSubscription.started_at).format('DD MMM YYYY')}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Package className="h-4 w-4 text-purple-600" />
              Current Package
            </div>
            <p className="text-lg font-bold text-slate-900">
              {agentSubscription.package.name}
            </p>
            <p className="text-sm text-slate-500">
              Rp{' '}
              {Number(agentSubscription.package.price).toLocaleString('id-ID')}
              ,- / {agentSubscription.package.duration_months} Months
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
