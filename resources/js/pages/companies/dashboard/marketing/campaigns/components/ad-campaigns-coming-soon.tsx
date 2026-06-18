import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { show as budgetIndex } from '@/routes/companies/dashboard/marketing/budget';
import { Link } from '@inertiajs/react';
import { IconBrandGoogle, IconBrandMeta } from '@tabler/icons-react';
import { MegaphoneIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

type AdCampaignsComingSoonProps = {
    companyUsername: string;
};

export default function AdCampaignsComingSoon({
    companyUsername,
}: AdCampaignsComingSoonProps) {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-5 py-14 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <MegaphoneIcon className="size-7" />
                </div>
                <div className="max-w-lg space-y-3">
                    <Badge variant="secondary">
                        <FormattedMessage defaultMessage="Coming soon" />
                    </Badge>
                    <p className="text-lg font-semibold">
                        <FormattedMessage defaultMessage="Paid ad campaigns are almost here" />
                    </p>
                    <p className="text-sm text-muted-foreground">
                        <FormattedMessage defaultMessage="Google and Meta campaign creation is in development. You can top up your promotion budget now so you are ready when ads launch." />
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#4285F4]/10">
                        <IconBrandGoogle className="size-5 text-[#4285F4]" />
                    </div>
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#1877F2]/10">
                        <IconBrandMeta className="size-5 text-[#1877F2]" />
                    </div>
                </div>
                <Button asChild>
                    <Link href={budgetIndex(companyUsername).url}>
                        <FormattedMessage defaultMessage="View promotion budget" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
