import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { IconFolderCode } from '@tabler/icons-react';
import { PlusIcon } from 'lucide-react';
import CreateBankAccountDialog from './create-bank-account-dialog';

export function EmptyBankAccounts() {
  return (
    <Empty className="min-h-[75vh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>No Bank Accounts Yet</EmptyTitle>
        <EmptyDescription>
          You have not added any bank accounts yet. Please add a bank account to
          enable withdrawals.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <CreateBankAccountDialog>
          <Button>
            <PlusIcon />
            Add Your First Account
          </Button>
        </CreateBankAccountDialog>
      </EmptyContent>
    </Empty>
  );
}
