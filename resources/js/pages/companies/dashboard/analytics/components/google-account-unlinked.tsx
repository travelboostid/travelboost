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

export function GoogleAccountUnlinked() {
    const { company } = usePageProps();

    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <IconBrandGoogle className="h-10 w-10" />
                </EmptyMedia>

                <EmptyTitle>No Google Account Connected</EmptyTitle>

                <EmptyDescription>
                    Connect your Google account to enable Analytics features,
                    sync data, and access real-time insights.
                </EmptyDescription>
                <EmptyContent className="flex-row justify-center gap-2 pt-4">
                    <a href={connect(company.username).url}>
                        <Button variant="default">
                            Connect your Google Account
                        </Button>
                    </a>
                </EmptyContent>
            </EmptyHeader>
        </Empty>
    );
}
