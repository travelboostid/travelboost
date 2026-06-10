import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { LandmarkIcon, PlusIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import CreateBankAccountDialog from './create-bank-account-dialog';

export function EmptyBankAccounts() {
    return (
        <Empty className="min-h-[50vh] rounded-xl border border-dashed">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <LandmarkIcon />
                </EmptyMedia>
                <EmptyTitle>
                    <FormattedMessage defaultMessage="No bank accounts yet" />
                </EmptyTitle>
                <EmptyDescription>
                    <FormattedMessage defaultMessage="Add a verified bank account to receive wallet withdrawals." />
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
                <CreateBankAccountDialog>
                    <Button size="lg" className="gap-2">
                        <PlusIcon className="size-4" />
                        <FormattedMessage defaultMessage="Add your first account" />
                    </Button>
                </CreateBankAccountDialog>
            </EmptyContent>
        </Empty>
    );
}
