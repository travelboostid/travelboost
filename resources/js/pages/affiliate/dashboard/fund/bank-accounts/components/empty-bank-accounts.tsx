import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Landmark, PlusIcon } from 'lucide-react';
import CreateBankAccountDialog from './create-bank-account-dialog';

export function EmptyBankAccounts() {
  return (
    <Empty className="min-h-[60vh] rounded-xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="bg-white text-slate-400 shadow-sm dark:bg-slate-950 dark:text-slate-500"
        >
          <Landmark className="w-8 h-8" />
        </EmptyMedia>
        <EmptyTitle>No Bank Accounts Added</EmptyTitle>
        <EmptyDescription>
          Add a bank account to receive your affiliate commission payments
          seamlessly.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex justify-center mt-4">
        <CreateBankAccountDialog>
          <Button className="bg-primary hover:bg-primary/90 shadow-sm">
            <PlusIcon className="w-4 h-4 mr-2" /> Add Your First Account
          </Button>
        </CreateBankAccountDialog>
      </EmptyContent>
    </Empty>
  );
}
