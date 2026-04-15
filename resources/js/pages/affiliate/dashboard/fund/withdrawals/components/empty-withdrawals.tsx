import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { IconWalletOff } from '@tabler/icons-react';

export default function EmptyWithdrawals() {
  return (
    <Empty className="p-10 border border-dashed border-slate-200 rounded-xl bg-slate-50">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="bg-white shadow-sm text-slate-400"
        >
          <IconWalletOff />
        </EmptyMedia>
        <EmptyTitle className="text-slate-700">No Withdrawals Found</EmptyTitle>
        <EmptyDescription className="max-w-xs">
          Your withdrawal history is empty for the selected period.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
