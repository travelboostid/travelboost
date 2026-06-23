import { TabsContent } from '@/components/ui/tabs';
import { FormattedMessage } from 'react-intl';

export function CreateTourAddOnsTab() {
    return (
        <TabsContent value="addons">
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            <FormattedMessage defaultMessage="Departure Date" />
                        </span>

                        {/* FROM */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                                <FormattedMessage defaultMessage="From" />
                            </span>

                            <input
                                type="date"
                                className="rounded-lg border px-3 py-2 text-sm"
                            />
                        </div>

                        {/* TO */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                                <FormattedMessage defaultMessage="To" />
                            </span>

                            <input
                                type="date"
                                className="rounded-lg border px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">
                        <FormattedMessage defaultMessage="Currency:" />
                    </div>
                </div>
            </div>
        </TabsContent>
    );
}
