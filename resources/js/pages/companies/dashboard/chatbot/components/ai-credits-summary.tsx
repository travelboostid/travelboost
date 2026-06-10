import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { formatIDR } from '@/lib/utils';
import { index as paymentsIndex } from '@/routes/companies/dashboard/payments';
import { Link } from '@inertiajs/react';
import {
    CoinsIcon,
    ExternalLinkIcon,
    PlusIcon,
    SparklesIcon,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import type { ChatbotPageProps } from '..';
import { AiCreditsTopupDialog } from './ai-credits-topup';

export default function AiCreditsSummary() {
    const { credit } = usePageProps<ChatbotPageProps>();
    const { company } = usePageSharedDataProps();

    const balance = Number(credit?.balance ?? 0);

    return (
        <Card className="flex h-full flex-col overflow-hidden border-0 bg-linear-to-br from-primary/10 via-card to-card shadow-sm ring-1 ring-primary/10">
            <CardHeader className="flex-1 space-y-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                    <Badge variant="secondary" className="gap-1">
                        <CoinsIcon className="size-3.5" />
                        <FormattedMessage defaultMessage="AI credits" />
                    </Badge>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                            <SparklesIcon className="size-5" />
                        </div>
                        <div>
                            <CardDescription className="text-xs font-medium tracking-wide uppercase">
                                <FormattedMessage defaultMessage="Available credits" />
                            </CardDescription>
                            <CardTitle className="text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
                                {formatIDR(balance)}
                            </CardTitle>
                        </div>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        <FormattedMessage defaultMessage="Credits are consumed when your AI chatbot responds to customer messages. Top up anytime to keep conversations running." />
                    </p>
                </div>
            </CardHeader>

            <CardFooter className="mt-auto flex flex-col gap-2 border-t border-primary/10 bg-background/40 pt-4 sm:flex-row">
                <AiCreditsTopupDialog>
                    <Button size="lg" className="h-11 w-full gap-2 sm:flex-1">
                        <PlusIcon className="size-4" />
                        <FormattedMessage defaultMessage="Top up credits" />
                    </Button>
                </AiCreditsTopupDialog>
                <Button
                    variant="outline"
                    size="lg"
                    className="h-11 w-full gap-2 bg-background/80 sm:flex-1"
                    asChild
                >
                    <Link
                        href={`${paymentsIndex({ company: company.username })}?type=ai-credit-topup-payment`}
                    >
                        <FormattedMessage defaultMessage="Payment history" />
                        <ExternalLinkIcon className="size-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
