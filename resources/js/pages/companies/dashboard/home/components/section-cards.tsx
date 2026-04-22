import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIDR } from '@/lib/utils';
import {
  CreditCard,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

export function SectionCards({ stats, type }: { stats: any; type: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
          <ShoppingBag size={80} />
        </div>
        <CardHeader className="pb-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Sales
          </div>
          <CardTitle className="text-2xl font-bold">
            {formatIDR(stats.sales?.total?.idr || 0)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-4 text-xs text-slate-500 font-medium">
            <span>{stats.sales?.total?.pax || 0} PAX</span>
            <span>{stats.sales?.total?.order || 0} Orders</span>
          </div>
          <div className="pt-2 border-t">
            <div className="text-[10px] text-slate-400 mb-1">This Month:</div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-600">
                {formatIDR(stats.sales?.monthly?.idr || 0)}
              </span>
              <Badge
                variant="secondary"
                className="text-[10px] bg-emerald-50 text-emerald-600 border-none"
              >
                +{stats.sales?.monthly?.pax || 0} Pax
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
          <Wallet size={80} />
        </div>
        <CardHeader className="pb-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {type === 'vendor' ? 'Total Profit' : 'Total Commission'}
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-600">
            {formatIDR(stats.commission?.total || 0)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-[10px] text-slate-400 mb-1">This Month:</div>
          <div className="text-lg font-bold">
            {formatIDR(stats.commission?.monthly || 0)}
          </div>
          <p className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1">
            <TrendingUp size={10} /> 12% increase from last month
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
          <Users size={80} />
        </div>
        <CardHeader className="pb-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Customers
          </div>
          <CardTitle className="text-3xl font-bold">
            {stats.counters?.customers || 0}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500">Active registered customers</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4">
            <div className="bg-blue-500 h-1.5 rounded-full w-[70%]"></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
          <CreditCard size={80} />
        </div>
        <CardHeader className="pb-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Wallet Balance
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            {formatIDR(stats.wallet?.balance || 5000000)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {type === 'agent' ? (
            <div className="mt-2 border-t pt-2">
              <p className="text-[10px] text-slate-400 mb-1">
                Subscription Status:
              </p>
              {stats.subscription?.ended_at ? (
                <Badge className="bg-emerald-50 text-emerald-600 border-none font-medium">
                  Valid until {stats.subscription.ended_at}
                </Badge>
              ) : (
                <Badge
                  variant="destructive"
                  className="border-none font-medium"
                >
                  Not subscribed yet
                </Badge>
              )}
            </div>
          ) : (
            <div className="mt-2 border-t pt-2">
              <p className="text-[10px] text-slate-400 mb-1">Account Status:</p>
              <Badge className="bg-blue-50 text-blue-600 border-none font-medium">
                Active Vendor
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
