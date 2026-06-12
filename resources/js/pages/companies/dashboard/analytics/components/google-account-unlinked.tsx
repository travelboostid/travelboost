import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import usePageProps from '@/hooks/use-page-props';
import { connect } from '@/routes/companies/dashboard/google';
import { IconBrandGoogle } from '@tabler/icons-react';
import { FormattedMessage } from 'react-intl';

export function GoogleAccountUnlinked() {
    const { company } = usePageProps();

    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <IconBrandGoogle className="h-10 w-10" />
                </EmptyMedia>

                <EmptyTitle>
                    <FormattedMessage defaultMessage="No Google Account Connected" />
                </EmptyTitle>

                <EmptyDescription>
                    <FormattedMessage defaultMessage="Connect your Google account to enable Analytics features, sync data, and access real-time insights." />
                </EmptyDescription>
                <EmptyContent className="flex-row justify-center gap-2 pt-4">
                    <a href={connect(company.username).url}>
                        <Button variant="default">
                            <FormattedMessage defaultMessage="Connect your Google Account" />
                        </Button>
                    </a>
                </EmptyContent>
            </EmptyHeader>
        </Empty>
    );
}
