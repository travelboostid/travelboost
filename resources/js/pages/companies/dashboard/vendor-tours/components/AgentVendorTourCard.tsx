import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IconPdf } from '@tabler/icons-react';
import { MessageSquareIcon, SaveIcon } from 'lucide-react';
import BaseTourCard from './BaseTourCard';

export default function AgentVendorTourCard({
  tour,
  isVendorNameVisible,
  canCopy,
  hasCopied,
  onCopy,
  onViewBrochure,
  onChat,
  startingChat,
}: any) {
  const isVendorInactive = String(tour.status).toLowerCase() !== 'active';

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
        <>
          <AlertDialog>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="flex-1 flex">
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className={`w-full rounded-xl h-9 shadow-sm transition-all ${isVendorInactive ? 'bg-red-500 text-white hover:bg-red-600' : hasCopied ? 'bg-primary text-primary-foreground opacity-40 grayscale' : 'bg-primary text-primary-foreground hover:scale-105 active:scale-95'}`}
                      disabled={hasCopied || isVendorInactive || !canCopy}
                    >
                      <SaveIcon size={18} />
                    </Button>
                  </AlertDialogTrigger>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add to Catalog</p>
              </TooltipContent>
            </Tooltip>
            <AlertDialogContent className="rounded-3xl border-none dark:bg-slate-900">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold dark:text-white">
                  Add to Catalog
                </AlertDialogTitle>
                <AlertDialogDescription className="dark:text-slate-400">
                  Copy this product to your personal catalog?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl font-bold dark:bg-slate-800 dark:text-white">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onCopy}
                  className="rounded-xl font-bold px-6"
                >
                  Yes, Copy Now
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 h-9 border-none text-slate-700 dark:text-slate-300"
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
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 h-9 border-none text-slate-700 dark:text-slate-300"
                disabled={startingChat}
                onClick={onChat}
              >
                {startingChat ? <Spinner /> : <MessageSquareIcon size={18} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Send Message to Vendor</p>
            </TooltipContent>
          </Tooltip>
        </>
      }
    />
  );
}
