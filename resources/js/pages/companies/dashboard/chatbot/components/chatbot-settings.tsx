import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import usePageProps from '@/hooks/use-page-props';
import { cn } from '@/lib/utils';
import { update } from '@/routes/companies/dashboard/chatbot';
import { router } from '@inertiajs/react';
import { BotIcon } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { toast } from 'sonner';
import type { ChatbotPageProps } from '..';

export default function ChatbotSettings() {
    const { settings, company } = usePageProps<ChatbotPageProps>();
    const [updating, setUpdating] = useState(false);
    const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null);
    const enabled = pendingEnabled ?? Boolean(settings.chatbot_enabled);

    const handleChange = (checked: boolean) => {
        setPendingEnabled(checked);

        router.put(
            update.url({ company: company.username }),
            { chatbot_enabled: checked },
            {
                preserveScroll: true,
                onBefore: () => setUpdating(true),
                onFinish: () => setUpdating(false),
                onSuccess: () => {
                    setPendingEnabled(null);
                    toast.success(
                        checked ? 'Chatbot enabled' : 'Chatbot disabled',
                    );
                },
                onError: () => {
                    setPendingEnabled(null);
                    toast.error('Failed to update chatbot settings');
                },
            },
        );
    };

    return (
        <Card className="overflow-hidden shadow-sm">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex min-w-0 items-start gap-3 sm:items-center">
                    <div
                        className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-xl',
                            enabled
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-muted text-muted-foreground',
                        )}
                    >
                        <BotIcon className="size-5" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                                <FormattedMessage defaultMessage="Chatbot" />
                            </p>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'capitalize',
                                    enabled
                                        ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {enabled ? (
                                    <FormattedMessage defaultMessage="Active" />
                                ) : (
                                    <FormattedMessage defaultMessage="Inactive" />
                                )}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <FormattedMessage defaultMessage="Automatically reply to customer messages on WhatsApp." />
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 rounded-xl border bg-muted/20 px-4 py-3 sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
                    <label
                        htmlFor="chatbot_enabled"
                        className="text-sm font-medium text-foreground"
                    >
                        <FormattedMessage defaultMessage="Enable chatbot" />
                    </label>
                    <Switch
                        id="chatbot_enabled"
                        disabled={updating}
                        checked={enabled}
                        onCheckedChange={handleChange}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
