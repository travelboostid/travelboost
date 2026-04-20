import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIDR } from '@/lib/utils';
import {
  Briefcase,
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
            {formatIDR(stats.sales.total.idr)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-4 text-xs text-slate-500 font-medium">
            <span>{stats.sales.total.pax} PAX</span>
            <span>{stats.sales.total.order} Orders</span>
          </div>
          <div className="pt-2 border-t">
            <div className="text-[10px] text-slate-400 mb-1">This Month:</div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-600">
                {formatIDR(stats.sales.monthly.idr)}
              </span>
              <Badge
                variant="secondary"
                className="text-[10px] bg-emerald-50 text-emerald-600 border-none"
              >
                +{stats.sales.monthly.pax} Pax
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
            {formatIDR(stats.commission.total)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-[10px] text-slate-400 mb-1">This Month:</div>
          <div className="text-lg font-bold">
            {formatIDR(stats.commission.monthly)}
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
            {stats.counters.customers}
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
          <Briefcase size={80} />
        </div>
        <CardHeader className="pb-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {type === 'vendor' ? 'Partner Agents' : 'Agent Ranking'}
          </div>
          <CardTitle className="text-3xl font-bold">
            {type === 'vendor' ? stats.counters.agents : '#4'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500">
            {type === 'vendor'
              ? 'Active agents in network'
              : 'Top 5% national agents'}
          </p>
          <Badge className="mt-4 bg-blue-50 text-blue-600 border-none">
            Keep growing! 🚀
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
