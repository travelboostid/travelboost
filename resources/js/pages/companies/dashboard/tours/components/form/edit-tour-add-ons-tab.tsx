import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MoneyInput from '@/components/ui/money-input';
import { Spinner } from '@/components/ui/spinner';
import { TabsContent } from '@/components/ui/tabs';
import { MoreVertical, Save, Trash2 } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

type TourTabProps = {
    context: any;
};

export function EditTourAddOnsTab({ context }: TourTabProps) {
    const intl = useIntl();
    const {
        addOns,
        addOnsSearchDepartureFrom,
        addOnsSearchDepartureTo,
        addRow,
        currentAddOnsPage,
        data,
        formatDate,
        handleDelete,
        paginatedAddOnsSchedules,
        savingAddOns,
        setAddOnsSearchDepartureFrom,
        setAddOnsSearchDepartureTo,
        setCurrentAddOnsPage,
        syncAddOns,
        totalAddOnsPages,
        tour,
        updateRow,
    } = context;

    return (
        <TabsContent value="addons">
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">
                    {data.code} {data.name}
                </h2>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
                    {/* LEFT */}
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
                                value={addOnsSearchDepartureFrom}
                                onChange={(e) => {
                                    setAddOnsSearchDepartureFrom(
                                        e.target.value,
                                    );
                                    setCurrentAddOnsPage(1);
                                }}
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
                                value={addOnsSearchDepartureTo}
                                onChange={(e) => {
                                    setAddOnsSearchDepartureTo(e.target.value);
                                    setCurrentAddOnsPage(1);
                                }}
                                className="rounded-lg border px-3 py-2 text-sm"
                            />
                        </div>

                        {/* RESET */}
                        {(addOnsSearchDepartureFrom ||
                            addOnsSearchDepartureTo) && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setAddOnsSearchDepartureFrom('');
                                    setAddOnsSearchDepartureTo('');
                                    setCurrentAddOnsPage(1);
                                }}
                            >
                                <FormattedMessage defaultMessage="Reset Date" />
                            </Button>
                        )}
                    </div>

                    {/* RIGHT */}
                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">
                        Currency: {tour.currency}
                    </div>
                </div>

                <div className="space-y-4">
                    <Accordion type="multiple" className="space-y-4">
                        {paginatedAddOnsSchedules.map((schedule) => {
                            const rows = addOns[schedule.id] || [];

                            return (
                                <AccordionItem
                                    key={schedule.id}
                                    value={`schedule-${schedule.id}`}
                                    className="overflow-hidden rounded-2xl border bg-card shadow-sm"
                                >
                                    {/* HEADER */}
                                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                        <div className="flex w-full items-center justify-between pr-4">
                                            {/* LEFT */}
                                            <div className="text-left">
                                                <div className="text-base font-semibold">
                                                    {formatDate(
                                                        schedule.departure_date,
                                                    )}{' '}
                                                    {'->'}{' '}
                                                    {formatDate(
                                                        schedule.return_date,
                                                    )}
                                                </div>

                                                <div className="mt-1 text-sm text-muted-foreground">
                                                    <FormattedMessage
                                                        defaultMessage="{count} add ons"
                                                        values={{
                                                            count: rows.length,
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* RIGHT */}
                                            <div className="rounded-lg border bg-muted/40 px-3 py-1 text-xs font-medium">
                                                {tour.currency}
                                            </div>
                                        </div>
                                    </AccordionTrigger>

                                    {/* CONTENT */}
                                    <AccordionContent className="border-t bg-muted/20 px-6 py-5">
                                        <div className="space-y-4">
                                            {rows.map((row, index) => (
                                                <div
                                                    key={index}
                                                    className="rounded-2xl border bg-background p-5 shadow-sm transition hover:shadow-md"
                                                >
                                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                        {/* LEFT CONTENT */}
                                                        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                                            {/* DESCRIPTION */}
                                                            <div className="space-y-2">
                                                                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                    <FormattedMessage defaultMessage="Add Ons Description" />
                                                                </Label>

                                                                <Input
                                                                    type="text"
                                                                    placeholder={intl.formatMessage(
                                                                        {
                                                                            defaultMessage:
                                                                                'Example: Extra baggage, Visa, Single supplement',
                                                                        },
                                                                    )}
                                                                    value={
                                                                        row.description
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateRow(
                                                                            schedule.id,
                                                                            index,
                                                                            'description',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            </div>

                                                            {/* PRICE */}
                                                            <div className="space-y-2">
                                                                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                    <FormattedMessage defaultMessage="Price Per Pax" />
                                                                </Label>

                                                                <MoneyInput
                                                                    className="text-right"
                                                                    value={
                                                                        row.price
                                                                    }
                                                                    onChange={(
                                                                        val,
                                                                    ) =>
                                                                        updateRow(
                                                                            schedule.id,
                                                                            index,
                                                                            'price',
                                                                            Number(
                                                                                val,
                                                                            ),
                                                                        )
                                                                    }
                                                                />
                                                            </div>

                                                            {/* TAXABLE */}
                                                            <div className="space-y-2">
                                                                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                    <FormattedMessage defaultMessage="Included in PPN" />
                                                                </Label>

                                                                <div className="flex h-10 items-center rounded-xl border px-3">
                                                                    <label className="flex items-center gap-2 text-sm">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                row.is_taxable
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateRow(
                                                                                    schedule.id,
                                                                                    index,
                                                                                    'is_taxable',
                                                                                    e
                                                                                        .target
                                                                                        .checked,
                                                                                )
                                                                            }
                                                                        />
                                                                        <FormattedMessage defaultMessage="Taxable" />
                                                                    </label>
                                                                </div>
                                                            </div>

                                                            {/* EDITABLE */}
                                                            <div className="space-y-2">
                                                                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                    <FormattedMessage defaultMessage="Editable" />
                                                                </Label>

                                                                <div className="flex h-10 items-center rounded-xl border px-3">
                                                                    <label className="flex items-center gap-2 text-sm">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                row.edit_status
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateRow(
                                                                                    schedule.id,
                                                                                    index,
                                                                                    'edit_status',
                                                                                    e
                                                                                        .target
                                                                                        .checked,
                                                                                )
                                                                            }
                                                                        />
                                                                        <FormattedMessage defaultMessage="Allow Edit" />
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* RIGHT ACTION */}
                                                        <div className="flex items-center justify-end lg:w-auto">
                                                            <DropdownMenu
                                                                modal={false}
                                                            >
                                                                <DropdownMenuTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-9 w-9 rounded-xl"
                                                                    >
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>

                                                                <DropdownMenuContent
                                                                    align="end"
                                                                    sideOffset={
                                                                        5
                                                                    }
                                                                    className="w-52 rounded-xl shadow-lg"
                                                                >
                                                                    {/* SAVE */}
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer"
                                                                        disabled={
                                                                            savingAddOns
                                                                        }
                                                                        onClick={() =>
                                                                            syncAddOns(
                                                                                addOns,
                                                                            )
                                                                        }
                                                                    >
                                                                        {savingAddOns ? (
                                                                            <Spinner className="mr-2 h-4 w-4" />
                                                                        ) : (
                                                                            <Save className="mr-2 h-4 w-4" />
                                                                        )}
                                                                        <FormattedMessage defaultMessage="Save Add Ons" />
                                                                    </DropdownMenuItem>

                                                                    <DropdownMenuSeparator />

                                                                    {/* DELETE */}
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                                                                        onClick={() =>
                                                                            handleDelete(
                                                                                schedule.id,
                                                                                index,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        <FormattedMessage defaultMessage="Delete Add Ons" />
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* ADD BUTTON */}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    addRow(schedule.id)
                                                }
                                            >
                                                <FormattedMessage defaultMessage="+ Add Add Ons" />
                                            </Button>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </div>
                <div className="mt-6 flex items-center justify-between border-t px-4 py-3">
                    <div className="text-sm text-muted-foreground">
                        Page {currentAddOnsPage} of {totalAddOnsPages}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentAddOnsPage === 1}
                            onClick={() => setCurrentAddOnsPage((p) => p - 1)}
                        >
                            <FormattedMessage defaultMessage="Previous" />
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentAddOnsPage === totalAddOnsPages}
                            onClick={() => setCurrentAddOnsPage((p) => p + 1)}
                        >
                            <FormattedMessage defaultMessage="Next" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex justify-start pt-6 border-t"></div>
        </TabsContent>
    );
}
