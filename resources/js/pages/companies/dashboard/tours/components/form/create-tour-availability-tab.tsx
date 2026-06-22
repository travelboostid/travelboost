import { TabsContent } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

export function CreateTourAvailabilityTab() {
    return (
        <TabsContent value="availability">
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
                    {/* LEFT */}
                    <div className="flex flex-wrap items-center gap-3">
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

                    {/* RIGHT */}
                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">
                        <FormattedMessage defaultMessage="Quantity: pax" />
                    </div>
                </div>

                <div className="hidden md:block rounded-xl border bg-background overflow-auto">
                    <table className="w-full text-xs border-separate border-spacing-0">
                        <colgroup>
                            <col className="w-[200px]" /> {/* Departure */}
                            <col className="w-[50px]" /> {/* Max Pax */}
                            <col className="w-[50px]" />
                            <col className="w-[50px]" />
                            <col className="w-[50px]" />
                            <col className="w-[50px]" />
                            <col className="w-[50px]" />
                            <col className="w-[50px]" />
                            <col className="w-[50px]" />
                            <col className="w-[50px]" />
                            <col className="w-[50px]" />
                            <col className="w-[50px]" />
                            <col className="w-[100px]" />
                            <col className="w-[70px]" /> {/* Action */}
                        </colgroup>
                        <thead className="sticky top-0 z-30 bg-muted">
                            <tr>
                                <th className="sticky left-0 z-40 bg-muted border-b p-3 text-left font-semibold">
                                    <FormattedMessage defaultMessage="Departure → Return" />
                                </th>
                                <th className="border-b p-2 text-right font-semibold">
                                    <FormattedMessage defaultMessage="Max Pax" />
                                </th>
                                <th className="border-b p-2 text-right font-semibold">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                <span>RS</span>

                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </TooltipTrigger>

                                        <TooltipContent>
                                            <FormattedMessage defaultMessage="Manual Reserved" />
                                        </TooltipContent>
                                    </Tooltip>
                                </th>
                                <th className="border-b p-2 text-right font-semibold">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                <span>WP</span>

                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </TooltipTrigger>

                                        <TooltipContent>
                                            <FormattedMessage defaultMessage="Waiting Payment" />
                                        </TooltipContent>
                                    </Tooltip>
                                </th>
                                <th className="border-b p-2 text-right font-semibold">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                <span>WA</span>

                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </TooltipTrigger>

                                        <TooltipContent>
                                            <FormattedMessage defaultMessage="Waiting Payment Approval" />
                                        </TooltipContent>
                                    </Tooltip>
                                </th>
                                <th className="border-b p-2 text-right font-semibold">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                <span>DP</span>

                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </TooltipTrigger>

                                        <TooltipContent>
                                            <FormattedMessage defaultMessage="Down Payment" />
                                        </TooltipContent>
                                    </Tooltip>
                                </th>
                                <th className="border-b p-2 text-right font-semibold">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                <span>FP</span>

                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </TooltipTrigger>

                                        <TooltipContent>
                                            <FormattedMessage defaultMessage="Full Payment" />
                                        </TooltipContent>
                                    </Tooltip>
                                </th>
                                <th className="border-b p-2 text-right font-semibold">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                <span>BR</span>

                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </TooltipTrigger>

                                        <TooltipContent>
                                            <FormattedMessage defaultMessage="Booking Reserved" />
                                        </TooltipContent>
                                    </Tooltip>
                                </th>
                                <th className="border-b p-2 text-right font-semibold">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                <span>CA</span>

                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </TooltipTrigger>

                                        <TooltipContent>
                                            <FormattedMessage defaultMessage="Cancel" />
                                        </TooltipContent>
                                    </Tooltip>
                                </th>
                                <th className="border-b p-2 text-right font-semibold">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                <span>RF</span>

                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </TooltipTrigger>

                                        <TooltipContent>
                                            <FormattedMessage defaultMessage="Refund" />
                                        </TooltipContent>
                                    </Tooltip>
                                </th>
                                <th className="border-b p-2 text-right font-semibold">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                <span>EX</span>

                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </TooltipTrigger>

                                        <TooltipContent>
                                            <FormattedMessage defaultMessage="Expired" />
                                        </TooltipContent>
                                    </Tooltip>
                                </th>
                                <th className="border-b p-2 text-right font-semibold">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                <span>WL</span>

                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </TooltipTrigger>

                                        <TooltipContent>
                                            <FormattedMessage defaultMessage="Waiting List" />
                                        </TooltipContent>
                                    </Tooltip>
                                </th>
                                <th className="border-b p-2 text-right font-semibold">
                                    <FormattedMessage defaultMessage="Available" />
                                </th>
                                <th className="sticky right-0 z-40 bg-muted border-b p-2 text-right font-semibold"></th>
                            </tr>
                        </thead>

                        <tbody></tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-start pt-6 border-t"></div>
        </TabsContent>
    );
}
