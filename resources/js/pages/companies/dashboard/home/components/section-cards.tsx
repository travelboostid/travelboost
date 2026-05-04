import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIDR } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import {
  CreditCard,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

export function SectionCards({ stats, company }: { stats: any; company: any }) {
  const type = company.type;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-none shadow-sm bg-card overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
          <ShoppingBag size={80} />
        </div>
        <CardHeader className="pb-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Sales
          </div>
          <CardTitle className="text-2xl font-bold text-card-foreground">
            {formatIDR(stats.sales?.total?.idr || 0)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-4 text-xs text-muted-foreground font-medium">
            <span>{stats.sales?.total?.pax || 0} PAX</span>
            <span>{stats.sales?.total?.order || 0} Orders</span>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="text-[10px] text-muted-foreground mb-1">
              This Month:
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">
                {formatIDR(stats.sales?.monthly?.idr || 0)}
              </span>
              <Badge
                variant="secondary"
                className="text-[10px] font-medium border-none"
              >
                +{stats.sales?.monthly?.pax || 0} Pax
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-card overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
          <Wallet size={80} />
        </div>
        <CardHeader className="pb-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {type === 'vendor' ? 'Total Profit' : 'Total Commission'}
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            {formatIDR(stats.commission?.total || 0)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-[10px] text-muted-foreground mb-1">
            This Month:
          </div>
          <div className="text-lg font-bold text-card-foreground">
            {formatIDR(stats.commission?.monthly || 0)}
          </div>
          <p className="text-[10px] text-primary flex items-center gap-1 mt-1">
            <TrendingUp size={10} /> 12% increase from last month
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-card overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
          <Users size={80} />
        </div>
        <CardHeader className="pb-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Customers
          </div>
          <CardTitle className="text-3xl font-bold text-card-foreground">
            {stats.counters?.customers || 0}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Active registered customers
          </p>
          <div className="w-full bg-secondary h-1.5 rounded-full mt-4">
            <div className="bg-primary h-1.5 rounded-full w-[70%]"></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-card overflow-hidden relative group flex flex-col justify-between">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
          <CreditCard size={80} />
        </div>
        <CardHeader className="pb-0 relative z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Wallet Balance
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-card-foreground">
            {formatIDR(stats.wallet?.balance || 0)}
          </CardTitle>
          <Link href={`/companies/${company.username}/dashboard/wallets`}>
            <Button
              variant="outline"
              className="h-6 text-[10px] font-semibold border-border"
            >
              Withdraw
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="relative z-10">
          {type === 'agent' ? (
            <div className="mt-2 border-t border-border pt-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">
                  AI Credits:
                </p>
                <Badge
                  variant="outline"
                  className="text-primary border-primary/20 bg-primary/5 font-medium flex items-center gap-1 w-max"
                >
                  <Sparkles size={12} /> {stats.ai_credit || 0} Credits
                </Badge>
              </div>
              <Link
                href={`/companies/${company.username}/dashboard/chatbot`}
                className="mt-4"
              >
                <Button
                  variant="ghost"
                  className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10 font-semibold"
                >
                  Top Up
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-2 border-t border-border pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">
                    AI Credits:
                  </p>
                  <Badge
                    variant="outline"
                    className="text-primary border-primary/20 bg-primary/5 font-medium flex items-center gap-1 w-max"
                  >
                    <Sparkles size={12} /> {formatIDR(stats.ai_credit || 0)}
                  </Badge>
                </div>
                <Link
                  href={`/companies/${company.username}/dashboard/ai-credits`}
                  className="mt-4"
                >
                  <Button
                    variant="ghost"
                    className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10 font-semibold"
                  >
                    Top Up
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
