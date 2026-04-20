import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIDR } from '@/lib/utils';
import { ChevronRight, Medal } from 'lucide-react';
import { useState } from 'react';

export function TopLists({ destinations, agents, type }: any) {
  const [page, setPage] = useState(0);
  const isVendor = type === 'vendor';

  const data = isVendor ? agents : destinations;
  // Strictly slice to 5 items per view
  const currentItems = data.slice(page * 5, (page + 1) * 5);

  return (
    <Card className="border-none shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Medal className="size-4 text-amber-500" />
          {isVendor ? 'Top 5 Agents' : 'Top 5 Destinations'}
        </CardTitle>
        <Button
          variant="ghost"
          size="xs"
          className="text-blue-600 text-[10px]"
          onClick={() => setPage((prev) => (prev === 0 ? 1 : 0))}
        >
          Next <ChevronRight size={12} />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {currentItems.map((item: any, idx: number) => (
            <div
              key={idx}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300 w-4">
                  {page * 5 + idx + 1}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold truncate max-w-[120px]">
                    {isVendor ? item.name : item.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isVendor ? `${item.pax} Total Pax` : item.code}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-600">
                  {formatIDR(isVendor ? item.profit : item.commission)}
                </div>
                <div className="text-[10px] text-slate-400 uppercase">
                  {isVendor ? 'Profit' : 'Commission'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
