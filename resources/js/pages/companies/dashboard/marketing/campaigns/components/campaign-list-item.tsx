import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { formatIDR } from '@/lib/utils';
import { pause as pauseCampaign } from '@/routes/companies/dashboard/marketing/campaigns';
import { router } from '@inertiajs/react';
import { IconBrandGoogle, IconBrandMeta } from '@tabler/icons-react';
import { ExternalLinkIcon, PauseIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedDate, FormattedMessage } from 'react-intl';
import CampaignStatusBadge from './campaign-status-badge';

type CampaignListItemProps = {
    campaign: {
        id: number;
        platform?: string;
        name: string;
        status: string;
        daily_budget: number;
        final_url: string;
        lifetime_spend: number;
        created_at: string | null;
    };
    companyUsername: string;
};

export default function CampaignListItem({
    campaign,
    companyUsername,
}: CampaignListItemProps) {
    const [confirmPause, setConfirmPause] = useState(false);
    const [pausing, setPausing] = useState(false);

    const handlePause = () => {
        setPausing(true);
        router.post(
            pauseCampaign({ company: companyUsername, campaign: campaign.id })
                .url,
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setPausing(false);
                    setConfirmPause(false);
                },
            },
        );
    };

    return (
        <>
            <Card className="transition-colors hover:bg-muted/20">
                <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{campaign.name}</p>
                            {campaign.platform === 'meta' ? (
                                <Badge variant="outline" className="gap-1">
                                    <IconBrandMeta className="size-3 text-[#1877F2]" />
                                    Meta
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="gap-1">
                                    <IconBrandGoogle className="size-3 text-[#4285F4]" />
                                    Google
                                </Badge>
                            )}
                            <CampaignStatusBadge status={campaign.status} />
                        </div>
                        <a
                            href={campaign.final_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex max-w-full items-center gap-1 truncate text-sm text-muted-foreground hover:text-foreground"
                        >
                            <span className="truncate">
                                {campaign.final_url}
                            </span>
                            <ExternalLinkIcon className="size-3.5 shrink-0" />
                        </a>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>
                                <FormattedMessage
                                    defaultMessage="Daily budget: {amount}"
                                    values={{
                                        amount: formatIDR(
                                            campaign.daily_budget,
                                        ),
                                    }}
                                />
                            </span>
                            <span>
                                <FormattedMessage
                                    defaultMessage="Lifetime spend: {amount}"
                                    values={{
                                        amount: formatIDR(
                                            campaign.lifetime_spend,
                                        ),
                                    }}
                                />
                            </span>
                            {campaign.created_at ? (
                                <span>
                                    <FormattedMessage
                                        defaultMessage="Created {date}"
                                        values={{
                                            date: (
                                                <FormattedDate
                                                    value={campaign.created_at}
                                                    dateStyle="medium"
                                                />
                                            ),
                                        }}
                                    />
                                </span>
                            ) : null}
                        </div>
                    </div>

                    {campaign.status === 'active' ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => setConfirmPause(true)}
                        >
                            <PauseIcon className="size-4" />
                            <FormattedMessage defaultMessage="Pause" />
                        </Button>
                    ) : null}
                </CardContent>
            </Card>

            <AlertDialog
                open={confirmPause}
                onOpenChange={(open) => {
                    if (!open && !pausing) {
                        setConfirmPause(false);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            <FormattedMessage defaultMessage="Pause this campaign?" />
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <FormattedMessage
                                defaultMessage="{name} will stop serving ads on Google. You can create a new campaign later, but paused campaigns cannot be resumed from TravelBoost yet."
                                values={{ name: campaign.name }}
                            />
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pausing}>
                            <FormattedMessage defaultMessage="Cancel" />
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={pausing}
                            onClick={(event) => {
                                event.preventDefault();
                                handlePause();
                            }}
                        >
                            {pausing ? <Spinner /> : null}
                            <FormattedMessage defaultMessage="Pause campaign" />
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
