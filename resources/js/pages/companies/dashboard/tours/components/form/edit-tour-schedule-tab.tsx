import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import MoneyInput from '@/components/ui/money-input';
import { TabsContent } from '@/components/ui/tabs';
import { Copy, MoreVertical, Save, Trash2 } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

type TourTabProps = {
    context: any;
};

export function EditTourScheduleTab({ context }: TourTabProps) {
    const {
        addRoom,
        addSchedule,
        currentSchedulePage,
        data,
        intl,
        openCopyModal,
        openDropdownIndex,
        paginatedSchedulesTab,
        priceCategories,
        removeRoom,
        removeSchedule,
        schedules,
        searchDepartureFromTab2,
        searchDepartureToTab2,
        setCurrentSchedulePage,
        setOpenDropdownIndex,
        setSearchDepartureFromTab2,
        setSearchDepartureToTab2,
        submitSchedule,
        totalSchedulePages,
        tour,
        updateRoom,
        updateRoomAdjustment,
        updateSchedule,
    } = context;

    return (
        <TabsContent value="schedule">
            <div className="space-y-4">
                <div className="flex flex-col gap-3 px-4 py-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">
                            {data.code} {data.name}
                        </h2>
                    </div>

                    <div className="flex justify-end">
                        <Button type="button" onClick={addSchedule}>
                            <FormattedMessage defaultMessage="+ Add New Schedule" />
                        </Button>
                    </div>
                </div>

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
                                value={searchDepartureFromTab2}
                                onChange={(e) => {
                                    setSearchDepartureFromTab2(e.target.value);
                                    setCurrentSchedulePage(1);
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
                                value={searchDepartureToTab2}
                                onChange={(e) => {
                                    setSearchDepartureToTab2(e.target.value);
                                    setCurrentSchedulePage(1);
                                }}
                                className="rounded-lg border px-3 py-2 text-sm"
                            />
                        </div>

                        {/* RESET */}
                        {(searchDepartureFromTab2 || searchDepartureToTab2) && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchDepartureFromTab2('');
                                    setSearchDepartureToTab2('');
                                    setCurrentSchedulePage(1);
                                }}
                            >
                                <FormattedMessage defaultMessage="Reset" />
                            </Button>
                        )}
                    </div>

                    {/* RIGHT */}
                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">
                        Currency: {tour.currency}
                    </div>
                </div>

                {/* DESKTOP TABLE */}
                <div className="hidden lg:block overflow-hidden rounded-lg border">
                    <table className="w-full border-collapse text-sm">
                        {/* ================= HEADER ================= */}
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-3 text-left" rowSpan={2}>
                                    <FormattedMessage defaultMessage="Departure" />
                                </th>
                                <th className="p-3 text-left" rowSpan={2}>
                                    <FormattedMessage defaultMessage="Return" />
                                </th>

                                <th className="p-3 text-center" colSpan={4}>
                                    <FormattedMessage defaultMessage="Prices" />
                                </th>

                                <th className="p-3 text-left" rowSpan={2}></th>
                            </tr>
                        </thead>

                        {/* ================= BODY ================= */}
                        <tbody>
                            {paginatedSchedulesTab.map((item) => {
                                const index = item.originalIndex;

                                return (
                                    <tr
                                        key={index}
                                        className="
                                                                border-t
                                                                align-top
                                                                hover:bg-muted/20
                                                                transition-colors
                                                            "
                                    >
                                        {/* DATE */}
                                        <td className="p-2">
                                            <Input
                                                type="date"
                                                value={item.departure_date}
                                                min={
                                                    new Date()
                                                        .toISOString()
                                                        .split('T')[0]
                                                }
                                                onChange={(e) =>
                                                    updateSchedule(
                                                        index,
                                                        'departure_date',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </td>

                                        <td className="p-2">
                                            <Input
                                                type="date"
                                                value={item.return_date}
                                                min={item.departure_date}
                                                readOnly
                                                className="bg-muted cursor-not-allowed"
                                                onChange={(e) =>
                                                    updateSchedule(
                                                        index,
                                                        'return_date',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </td>

                                        {/* PRICES */}
                                        <td colSpan={4} className="p-2">
                                            <Accordion
                                                type="single"
                                                collapsible
                                                className="w-full"
                                            >
                                                <AccordionItem
                                                    value={`prices-${index}`}
                                                    className="
                                                                        rounded-xl
                                                                        border
                                                                        bg-background
                                                                        shadow-sm
                                                                        overflow-hidden
                                                                        "
                                                >
                                                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                                        <div className="flex w-full items-center justify-between pr-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">
                                                                    <FormattedMessage defaultMessage="Categories & Pricing" />
                                                                </span>

                                                                <Badge variant="secondary">
                                                                    <FormattedMessage
                                                                        defaultMessage="{count} item"
                                                                        values={{
                                                                            count:
                                                                                item
                                                                                    .prices
                                                                                    ?.length ??
                                                                                0,
                                                                        }}
                                                                    />
                                                                </Badge>
                                                            </div>

                                                            <span className="text-xs text-muted-foreground">
                                                                <FormattedMessage defaultMessage="Click to manage categories" />
                                                            </span>
                                                        </div>
                                                    </AccordionTrigger>

                                                    <AccordionContent className="border-t px-4 py-4">
                                                        {/* HEADER */}
                                                        <div
                                                            className="
                                                                                    grid
                                                                                    gap-3
                                                                                    px-1
                                                                                    pb-2
                                                                                    text-xs
                                                                                    font-medium
                                                                                    text-muted-foreground
                                                                                "
                                                            style={{
                                                                gridTemplateColumns:
                                                                    '24% 22% 1fr 44px',
                                                            }}
                                                        >
                                                            <div>
                                                                <FormattedMessage defaultMessage="Category" />
                                                            </div>
                                                            <div>
                                                                <FormattedMessage defaultMessage="Price" />
                                                            </div>
                                                            <div>
                                                                <FormattedMessage defaultMessage="Promotion" />
                                                            </div>
                                                            <div></div>
                                                        </div>

                                                        {/* CONTENT */}
                                                        <div className="rounded-md border p-3 space-y-3">
                                                            {(
                                                                item.prices ||
                                                                []
                                                            ).map(
                                                                (
                                                                    room,
                                                                    rIndex,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            rIndex
                                                                        }
                                                                        className="rounded-lg border bg-muted/20 p-3"
                                                                    >
                                                                        <div className="grid grid-cols-4 gap-3 items-start">
                                                                            {/* ROOM */}
                                                                            <select
                                                                                className="border rounded px-2 h-9 text-sm w-full bg-background"
                                                                                value={
                                                                                    room.room_type_id ??
                                                                                    ''
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    updateRoom(
                                                                                        index,
                                                                                        rIndex,
                                                                                        'room_type_id',
                                                                                        Number(
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        ),
                                                                                    )
                                                                                }
                                                                            >
                                                                                <option value="">
                                                                                    {intl.formatMessage(
                                                                                        {
                                                                                            defaultMessage:
                                                                                                'Select Category',
                                                                                        },
                                                                                    )}
                                                                                </option>

                                                                                {(
                                                                                    priceCategories ||
                                                                                    []
                                                                                )
                                                                                    .sort(
                                                                                        (
                                                                                            a,
                                                                                            b,
                                                                                        ) =>
                                                                                            a.id -
                                                                                            b.id,
                                                                                    )
                                                                                    .filter(
                                                                                        (
                                                                                            cat,
                                                                                        ) => {
                                                                                            const selectedIds =
                                                                                                (
                                                                                                    item.prices ||
                                                                                                    []
                                                                                                )
                                                                                                    .map(
                                                                                                        (
                                                                                                            p,
                                                                                                            i,
                                                                                                        ) =>
                                                                                                            i !==
                                                                                                            rIndex
                                                                                                                ? p.room_type_id
                                                                                                                : null,
                                                                                                    )
                                                                                                    .filter(
                                                                                                        Boolean,
                                                                                                    );

                                                                                            return !selectedIds.includes(
                                                                                                cat.id,
                                                                                            );
                                                                                        },
                                                                                    )
                                                                                    .map(
                                                                                        (
                                                                                            cat,
                                                                                        ) => (
                                                                                            <option
                                                                                                key={
                                                                                                    cat.id
                                                                                                }
                                                                                                value={
                                                                                                    cat.id
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    cat.name
                                                                                                }
                                                                                            </option>
                                                                                        ),
                                                                                    )}
                                                                            </select>

                                                                            {/* PRICE */}
                                                                            <MoneyInput
                                                                                value={
                                                                                    room.price
                                                                                }
                                                                                placeholder={intl.formatMessage(
                                                                                    {
                                                                                        defaultMessage:
                                                                                            'Price',
                                                                                    },
                                                                                )}
                                                                                onChange={(
                                                                                    val,
                                                                                ) =>
                                                                                    updateRoom(
                                                                                        index,
                                                                                        rIndex,
                                                                                        'price',
                                                                                        val,
                                                                                    )
                                                                                }
                                                                            />

                                                                            {/* PROMOTION */}
                                                                            <div
                                                                                className="grid gap-3 items-center"
                                                                                style={{
                                                                                    gridTemplateColumns:
                                                                                        '120px 180px',
                                                                                }}
                                                                            >
                                                                                <div className="relative flex-[2]">
                                                                                    <input
                                                                                        type="text"
                                                                                        inputMode="decimal"
                                                                                        className="w-full pr-8 border rounded px-2 h-9 text-sm"
                                                                                        value={
                                                                                            room
                                                                                                .promotion
                                                                                                .type ===
                                                                                            'percent'
                                                                                                ? room
                                                                                                      .promotion
                                                                                                      .value
                                                                                                : ''
                                                                                        }
                                                                                        placeholder={intl.formatMessage(
                                                                                            {
                                                                                                defaultMessage:
                                                                                                    'Promotion',
                                                                                            },
                                                                                        )}
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) => {
                                                                                            let raw =
                                                                                                e.target.value
                                                                                                    .replace(
                                                                                                        /[^0-9.,]/g,
                                                                                                        '',
                                                                                                    )
                                                                                                    .replace(
                                                                                                        ',',
                                                                                                        '.',
                                                                                                    );

                                                                                            if (
                                                                                                Number(
                                                                                                    raw,
                                                                                                ) >
                                                                                                100
                                                                                            )
                                                                                                raw =
                                                                                                    '100';

                                                                                            updateRoomAdjustment(
                                                                                                index,
                                                                                                rIndex,
                                                                                                'promotion',
                                                                                                'type',
                                                                                                'percent',
                                                                                            );

                                                                                            updateRoomAdjustment(
                                                                                                index,
                                                                                                rIndex,
                                                                                                'promotion',
                                                                                                'value',
                                                                                                raw,
                                                                                            );
                                                                                        }}
                                                                                    />

                                                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
                                                                                        %
                                                                                    </span>
                                                                                </div>

                                                                                <div>
                                                                                    <MoneyInput
                                                                                        value={
                                                                                            room
                                                                                                .promotion
                                                                                                .type ===
                                                                                            'value'
                                                                                                ? room
                                                                                                      .promotion
                                                                                                      .value
                                                                                                : ''
                                                                                        }
                                                                                        placeholder={intl.formatMessage(
                                                                                            {
                                                                                                defaultMessage:
                                                                                                    'Promotion Value',
                                                                                            },
                                                                                        )}
                                                                                        onChange={(
                                                                                            val,
                                                                                        ) => {
                                                                                            updateRoomAdjustment(
                                                                                                index,
                                                                                                rIndex,
                                                                                                'promotion',
                                                                                                'type',
                                                                                                'value',
                                                                                            );

                                                                                            updateRoomAdjustment(
                                                                                                index,
                                                                                                rIndex,
                                                                                                'promotion',
                                                                                                'value',
                                                                                                val,
                                                                                            );
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        {/* REMOVE ROOM */}
                                                                        <div className="col-span-4 flex justify-end">
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                className="text-red-500"
                                                                                onClick={() =>
                                                                                    removeRoom(
                                                                                        index,
                                                                                        rIndex,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <FormattedMessage defaultMessage="Delete Category" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}

                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    addRoom(
                                                                        index,
                                                                    )
                                                                }
                                                                disabled={
                                                                    (
                                                                        item.prices ||
                                                                        []
                                                                    ).filter(
                                                                        (p) =>
                                                                            p.room_type_id,
                                                                    ).length >=
                                                                    (
                                                                        priceCategories ||
                                                                        []
                                                                    ).length
                                                                }
                                                            >
                                                                <FormattedMessage defaultMessage="+ Add Category" />
                                                            </Button>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        </td>

                                        {/* ACTION */}
                                        <td className="p-2">
                                            <DropdownMenu
                                                open={
                                                    openDropdownIndex === index
                                                }
                                                onOpenChange={(open) => {
                                                    setOpenDropdownIndex(
                                                        open ? index : null,
                                                    );
                                                }}
                                            >
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-48 rounded-xl shadow-lg"
                                                >
                                                    {/* SAVE */}
                                                    <DropdownMenuItem
                                                        className="cursor-pointer"
                                                        onClick={submitSchedule}
                                                        disabled={
                                                            schedules.length ===
                                                            0
                                                        }
                                                    >
                                                        <Save className="mr-2 h-4 w-4" />
                                                        <FormattedMessage defaultMessage="Save Schedule" />
                                                    </DropdownMenuItem>

                                                    {/* COPY */}
                                                    <DropdownMenuItem
                                                        className="cursor-pointer"
                                                        onClick={() => {
                                                            openCopyModal(
                                                                index,
                                                            );

                                                            setOpenDropdownIndex(
                                                                null,
                                                            );
                                                        }}
                                                    >
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        <FormattedMessage defaultMessage="Copy Schedule" />
                                                    </DropdownMenuItem>

                                                    <DropdownMenuSeparator />

                                                    {/* DELETE */}
                                                    <DropdownMenuItem
                                                        className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                                                        onClick={() => {
                                                            removeSchedule(
                                                                index,
                                                            );

                                                            setOpenDropdownIndex(
                                                                null,
                                                            );
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <FormattedMessage defaultMessage="Delete Schedule" />
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="flex items-center justify-between border-t px-4 py-3">
                        <div className="text-sm text-muted-foreground">
                            Page{' '}
                            {totalSchedulePages === 0 ? 0 : currentSchedulePage}{' '}
                            of {totalSchedulePages}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={currentSchedulePage === 1}
                                onClick={() =>
                                    setCurrentSchedulePage((p) => p - 1)
                                }
                            >
                                <FormattedMessage defaultMessage="Previous" />
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={
                                    currentSchedulePage === totalSchedulePages
                                }
                                onClick={() =>
                                    setCurrentSchedulePage((p) => p + 1)
                                }
                            >
                                <FormattedMessage defaultMessage="Next" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* MOBILE VERSION */}
                <div className="md:hidden space-y-4">
                    {paginatedSchedulesTab.map((item) => {
                        const index = item.originalIndex;

                        return (
                            <div
                                key={index}
                                className="
        rounded-xl
        border
        bg-background
        p-4
        shadow-sm
        space-y-4
    "
                            >
                                {/* HEADER */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium">
                                            {item.departure_date ||
                                                intl.formatMessage({
                                                    defaultMessage:
                                                        'New Schedule',
                                                })}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            {item.return_date || '-'}
                                        </p>
                                    </div>

                                    <div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent
                                                align="end"
                                                className="w-48 rounded-xl shadow-lg"
                                            >
                                                {/* SAVE */}
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={submitSchedule}
                                                    disabled={
                                                        schedules.length === 0
                                                    }
                                                >
                                                    <Save className="mr-2 h-4 w-4" />
                                                    <FormattedMessage defaultMessage="Save Schedule" />
                                                </DropdownMenuItem>

                                                {/* COPY */}
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onClick={() =>
                                                        openCopyModal(index)
                                                    }
                                                >
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    <FormattedMessage defaultMessage="Copy Schedule" />
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                {/* DELETE */}
                                                <DropdownMenuItem
                                                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                                                    onClick={() =>
                                                        removeSchedule(index)
                                                    }
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <FormattedMessage defaultMessage="Delete Schedule" />
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* DATES */}
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            <FormattedMessage defaultMessage="Departure" />
                                        </p>
                                        <Input
                                            type="date"
                                            value={item.departure_date}
                                            onChange={(e) =>
                                                updateSchedule(
                                                    index,
                                                    'departure_date',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            <FormattedMessage defaultMessage="Return" />
                                        </p>
                                        <Input
                                            type="date"
                                            value={item.return_date}
                                            min={item.departure_date}
                                            readOnly
                                            className="bg-muted cursor-not-allowed"
                                            onChange={(e) =>
                                                updateSchedule(
                                                    index,
                                                    'return_date',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                {/* ROOMS */}
                                <Accordion type="single" collapsible>
                                    <AccordionItem value={`prices-${index}`}>
                                        <AccordionTrigger>
                                            <div className="flex items-center gap-2">
                                                <FormattedMessage defaultMessage="Categories" />
                                                <Badge variant="secondary">
                                                    {item.prices?.length ?? 0}
                                                </Badge>
                                            </div>
                                        </AccordionTrigger>

                                        <AccordionContent>
                                            <div className="space-y-3">
                                                {(item.prices || []).map(
                                                    (room, rIndex) => (
                                                        <div
                                                            key={rIndex}
                                                            className="border rounded-md p-3 space-y-2"
                                                        >
                                                            {/* ROOM HEADER */}
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-xs font-medium text-muted-foreground">
                                                                    <FormattedMessage
                                                                        defaultMessage="Room #{number}"
                                                                        values={{
                                                                            number:
                                                                                rIndex +
                                                                                1,
                                                                        }}
                                                                    />
                                                                </p>

                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-red-500"
                                                                    onClick={() =>
                                                                        removeRoom(
                                                                            index,
                                                                            rIndex,
                                                                        )
                                                                    }
                                                                >
                                                                    <FormattedMessage defaultMessage="Delete Category" />
                                                                </Button>
                                                            </div>

                                                            {/* ROOM TYPE */}
                                                            <div className="space-y-1">
                                                                <p className="text-xs text-muted-foreground">
                                                                    <FormattedMessage defaultMessage="Category" />
                                                                </p>

                                                                <select
                                                                    className="w-full border rounded-md px-3 h-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                                                    value={
                                                                        room.room_type_id ??
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateRoom(
                                                                            index,
                                                                            rIndex,
                                                                            'room_type_id',
                                                                            Number(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        )
                                                                    }
                                                                >
                                                                    <option value="">
                                                                        {intl.formatMessage(
                                                                            {
                                                                                defaultMessage:
                                                                                    'Select Category',
                                                                            },
                                                                        )}
                                                                    </option>

                                                                    {(
                                                                        priceCategories ||
                                                                        []
                                                                    )
                                                                        .filter(
                                                                            (
                                                                                cat,
                                                                            ) => {
                                                                                const selectedIds =
                                                                                    (
                                                                                        item.prices ||
                                                                                        []
                                                                                    )
                                                                                        .map(
                                                                                            (
                                                                                                p,
                                                                                                i,
                                                                                            ) =>
                                                                                                i !==
                                                                                                rIndex
                                                                                                    ? p.room_type_id
                                                                                                    : null,
                                                                                        )
                                                                                        .filter(
                                                                                            Boolean,
                                                                                        );

                                                                                return !selectedIds.includes(
                                                                                    cat.id,
                                                                                );
                                                                            },
                                                                        )
                                                                        .map(
                                                                            (
                                                                                cat,
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        cat.id
                                                                                    }
                                                                                    value={
                                                                                        cat.id
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        cat.name
                                                                                    }
                                                                                </option>
                                                                            ),
                                                                        )}
                                                                </select>
                                                            </div>

                                                            {/* PRICE */}
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">
                                                                    <FormattedMessage defaultMessage="Price" />
                                                                </p>
                                                                <MoneyInput
                                                                    value={
                                                                        room.price
                                                                    }
                                                                    placeholder={intl.formatMessage(
                                                                        {
                                                                            defaultMessage:
                                                                                'Price',
                                                                        },
                                                                    )}
                                                                    onChange={(
                                                                        val,
                                                                    ) =>
                                                                        updateRoom(
                                                                            index,
                                                                            rIndex,
                                                                            'price',
                                                                            val,
                                                                        )
                                                                    }
                                                                />
                                                            </div>

                                                            {/* PROMOTION */}
                                                            <div className="space-y-1">
                                                                <p className="text-xs text-muted-foreground">
                                                                    <FormattedMessage defaultMessage="Promotion" />
                                                                </p>

                                                                <div className="grid gap-2 sm:grid-cols-2">
                                                                    {/* % */}
                                                                    <div className="relative">
                                                                        <MoneyInput
                                                                            value={
                                                                                room
                                                                                    .promotion
                                                                                    .type ===
                                                                                'percent'
                                                                                    ? room
                                                                                          .promotion
                                                                                          .value
                                                                                    : ''
                                                                            }
                                                                            placeholder={intl.formatMessage(
                                                                                {
                                                                                    defaultMessage:
                                                                                        '0',
                                                                                },
                                                                            )}
                                                                            className="pr-8"
                                                                            onChange={(
                                                                                val,
                                                                            ) => {
                                                                                updateRoomAdjustment(
                                                                                    index,
                                                                                    rIndex,
                                                                                    'promotion',
                                                                                    'type',
                                                                                    'percent',
                                                                                );
                                                                                updateRoomAdjustment(
                                                                                    index,
                                                                                    rIndex,
                                                                                    'promotion',
                                                                                    'value',
                                                                                    val,
                                                                                );
                                                                            }}
                                                                        />

                                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                                            %
                                                                        </span>
                                                                    </div>

                                                                    {/* VALUE */}
                                                                    <MoneyInput
                                                                        value={
                                                                            room
                                                                                .promotion
                                                                                .type ===
                                                                            'value'
                                                                                ? room
                                                                                      .promotion
                                                                                      .value
                                                                                : ''
                                                                        }
                                                                        placeholder={intl.formatMessage(
                                                                            {
                                                                                defaultMessage:
                                                                                    'Value',
                                                                            },
                                                                        )}
                                                                        onChange={(
                                                                            val,
                                                                        ) => {
                                                                            updateRoomAdjustment(
                                                                                index,
                                                                                rIndex,
                                                                                'promotion',
                                                                                'type',
                                                                                'value',
                                                                            );
                                                                            updateRoomAdjustment(
                                                                                index,
                                                                                rIndex,
                                                                                'promotion',
                                                                                'value',
                                                                                val,
                                                                            );
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* COMMISSION */}
                                                            {/*<div className="space-y-1">
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    Commission
                                                                                </p>

                                                                                <div className="grid gap-2 sm:grid-cols-2">
                                                                                    
                                                                                    <div className="relative">
                                                                                        <MoneyInput
                                                                                            value={
                                                                                                room
                                                                                                    .commission
                                                                                                    .type ===
                                                                                                'percent'
                                                                                                    ? room
                                                                                                          .commission
                                                                                                          .value
                                                                                                    : ''
                                                                                            }
                                                                                            placeholder={intl.formatMessage({ defaultMessage: "0" })}
                                                                                            className="pr-8"
                                                                                            onChange={(
                                                                                                val,
                                                                                            ) => {
                                                                                                updateRoomAdjustment(
                                                                                                    index,
                                                                                                    rIndex,
                                                                                                    'commission',
                                                                                                    'type',
                                                                                                    'percent',
                                                                                                );
                                                                                                updateRoomAdjustment(
                                                                                                    index,
                                                                                                    rIndex,
                                                                                                    'commission',
                                                                                                    'value',
                                                                                                    val,
                                                                                                );
                                                                                            }}
                                                                                        />

                                                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                                                            %
                                                                                        </span>
                                                                                    </div>

                                                                                    
                                                                                    <MoneyInput
                                                                                        value={
                                                                                            room
                                                                                                .commission
                                                                                                .type ===
                                                                                            'value'
                                                                                                ? room
                                                                                                      .commission
                                                                                                      .value
                                                                                                : ''
                                                                                        }
                                                                                        placeholder={intl.formatMessage({ defaultMessage: "Value" })}
                                                                                        onChange={(
                                                                                            val,
                                                                                        ) => {
                                                                                            updateRoomAdjustment(
                                                                                                index,
                                                                                                rIndex,
                                                                                                'commission',
                                                                                                'type',
                                                                                                'value',
                                                                                            );
                                                                                            updateRoomAdjustment(
                                                                                                index,
                                                                                                rIndex,
                                                                                                'commission',
                                                                                                'value',
                                                                                                val,
                                                                                            );
                                                                                        }}
                                                                                    />
                                                                                </div> 
                                                                            </div> */}
                                                        </div>
                                                    ),
                                                )}

                                                {/* ADD ROOM */}
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={() =>
                                                        addRoom(index)
                                                    }
                                                    disabled={
                                                        (
                                                            item.prices || []
                                                        ).filter(
                                                            (p) =>
                                                                p.room_type_id,
                                                        ).length >=
                                                        (priceCategories || [])
                                                            .length
                                                    }
                                                >
                                                    <FormattedMessage defaultMessage="+ Add Category" />
                                                </Button>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        );
                    })}
                    <div
                        className="
        mt-6
        flex flex-col gap-3
        border-t
        px-4 pt-4
        sm:flex-row
        sm:items-center
        sm:justify-between
    "
                    >
                        <div className="text-sm text-muted-foreground">
                            <FormattedMessage
                                defaultMessage="Page {current} of {total}"
                                values={{
                                    current: currentSchedulePage,
                                    total: totalSchedulePages,
                                }}
                            />
                        </div>

                        <div className="flex w-full gap-2 sm:w-auto">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex-1 sm:flex-none"
                                disabled={currentSchedulePage === 1}
                                onClick={() =>
                                    setCurrentSchedulePage((p) => p - 1)
                                }
                            >
                                <FormattedMessage defaultMessage="Previous" />
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex-1 sm:flex-none"
                                disabled={
                                    currentSchedulePage === totalSchedulePages
                                }
                                onClick={() =>
                                    setCurrentSchedulePage((p) => p + 1)
                                }
                            >
                                <FormattedMessage defaultMessage="Next" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </TabsContent>
    );
}
