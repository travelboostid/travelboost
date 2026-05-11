import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IconPdf } from '@tabler/icons-react';
import BaseTourCard from './BaseTourCard';

export default function VendorTourCard({
  tour,
  isVendorNameVisible,
  isVendorInactive,
  onViewBrochure,
}: any) {
  return (
    <BaseTourCard
      tour={tour}
      isVendorNameVisible={isVendorNameVisible}
      isVendorInactive={isVendorInactive}
      statusSection={
        <div className="px-4 py-2 border-t border-slate-50 dark:border-slate-800/60">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
              Vendor Status
            </span>
            <span
              className={`text-[9px] font-black uppercase ${tour.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}
            >
              {tour.status}
            </span>
          </div>
        </div>
      }
      footerSection={
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 h-9 border-none text-slate-700 dark:text-slate-300"
              disabled={!tour.document}
              onClick={onViewBrochure}
            >
              <IconPdf size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View Brochure</p>
          </TooltipContent>
        </Tooltip>
      }
    />
  );
}
