import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { ShieldIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

export function EmptyRoles() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldIcon className="size-6" />
            </div>
            <Empty className="border-0 p-0">
                <EmptyHeader>
                    <EmptyMedia variant="icon" className="hidden" />
                    <EmptyTitle className="text-sm font-semibold">
                        <FormattedMessage defaultMessage="No roles found" />
                    </EmptyTitle>
                    <EmptyDescription className="max-w-sm text-sm">
                        <FormattedMessage defaultMessage="Try adjusting your filters or create a new access role for your team." />
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        </div>
    );
}
