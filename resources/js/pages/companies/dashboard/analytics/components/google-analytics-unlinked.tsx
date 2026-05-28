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
import { showAccountSetupOrSelections } from '@/routes/companies/dashboard/analytics';
import { Link } from '@inertiajs/react';
import { IconBrandGoogleAnalytics } from '@tabler/icons-react';

export function GoogleAnalyticsUnlinked() {
    const { company } = usePageProps();

    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <IconBrandGoogleAnalytics className="h-10 w-10" />
                </EmptyMedia>

                <EmptyTitle>One Step Ahead!</EmptyTitle>

                <EmptyDescription>
                    Link your Google Analytics property to start collecting
                    real-time insights, understand user behavior, and measure
                    your company’s performance.
                </EmptyDescription>
                <EmptyContent className="flex-row justify-center gap-2 pt-4">
                    <Link href={showAccountSetupOrSelections(company.username)}>
                        <Button variant="default">
                            Connect Analytics Property
                        </Button>
                    </Link>
                </EmptyContent>
            </EmptyHeader>
        </Empty>
    );
}
