import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MoneyInput from '@/components/ui/money-input';
import { Spinner } from '@/components/ui/spinner';
import { TabsContent } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { InfoIcon, MoreVertical, RefreshCw, Save } from 'lucide-react';
import { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';

type TourTabProps = {
    context: any;
};

export function EditTourAvailabilityTab({ context }: TourTabProps) {
    const {
        AVAILABILITY_MOBILE_FIELDS,
        currentPage,
        data,
        filteredData,
        formatDate,
        formatManualReservedCountdown,
        formatManualReservedDateTime,
        getManualReservedStatus,
        handleAvailabilitySave,
        handleManualReservedReset,
        manualReservedLimitDescription,
        pageSize,
        paginatedAvailability,
        savingAvailability,
        searchDepartureFrom,
        searchDepartureTo,
        setCurrentPage,
        setSearchDepartureFrom,
        setSearchDepartureTo,
        totalPages,
        updateAvailability,
    } = context;

    return (
        <TabsContent value="availability">
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">
                    {data.code} {data.name}
                </h2>
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
                                value={searchDepartureFrom}
                                onChange={(e) => {
                                    setSearchDepartureFrom(e.target.value);
                                    setCurrentPage(1);
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
                                value={searchDepartureTo}
                                onChange={(e) => {
                                    setSearchDepartureTo(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="rounded-lg border px-3 py-2 text-sm"
                            />
                        </div>

                        {/* RESET */}
                        {(searchDepartureFrom || searchDepartureTo) && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchDepartureFrom('');
                                    setSearchDepartureTo('');
                                    setCurrentPage(1);
                                }}
                            >
                                <FormattedMessage defaultMessage="Reset Date" />
                            </Button>
                        )}
                    </div>

                    {/* RIGHT */}
                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium whitespace-nowrap">
                        <FormattedMessage
                            defaultMessage="Total Available Pax: {total}"
                            values={{
                                total: filteredData.reduce(
                                    (acc, row) => acc + (row.available || 0),
                                    0,
                                ),
                            }}
                        />
                    </div>
                </div>

                <div className="hidden md:block rounded-xl border bg-background overflow-auto">
                    <table className="w-full text-xs border-separate border-spacing-0">
                        <colgroup>
                            <col className="w-[200px]" />
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
                            <col className="w-[50px]" />
                            <col className="w-[100px]" />
                            <col className="w-[70px]" />
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
                                            {manualReservedLimitDescription}
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

                        <tbody>
                            {paginatedAvailability.map((row, i) => {
                                const realIndex =
                                    (currentPage - 1) * pageSize + i;
                                const bgClass =
                                    i % 2 === 0
                                        ? 'bg-transparent'
                                        : 'bg-muted/20';
                                const status = getManualReservedStatus(row);
                                const hasStatus = status.kind !== 'idle';

                                return (
                                    <Fragment key={row.id ?? `new-${i}`}>
                                        <tr
                                            className={`border-t hover:bg-muted/40 transition-colors ${bgClass}`}
                                        >
                                            <td className="sticky left-0 z-20 bg-background border-b p-3 font-medium whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span>
                                                        {formatDate(
                                                            row.departure_date,
                                                        )}
                                                    </span>

                                                    <span>
                                                        {formatDate(
                                                            row.return_date,
                                                        )}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* max pax */}
                                            <td className="border-b p-3">
                                                <MoneyInput
                                                    className="h-9 min-w-[45px] text-right text-xs"
                                                    value={row.max_pax}
                                                    onChange={(val) =>
                                                        updateAvailability(
                                                            realIndex,
                                                            'max_pax',
                                                            Number(val),
                                                        )
                                                    }
                                                />
                                            </td>

                                            {/* RS */}
                                            <td className="border-b p-3">
                                                <MoneyInput
                                                    className="h-9 min-w-[45px] text-right text-xs"
                                                    value={row.RS}
                                                    onChange={(val) =>
                                                        updateAvailability(
                                                            realIndex,
                                                            'RS',
                                                            Number(val),
                                                        )
                                                    }
                                                />
                                            </td>

                                            {/* WP */}
                                            <td className="border-b p-2 text-right">
                                                <span
                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                >
                                                    {row.WP}
                                                </span>
                                            </td>

                                            {/* DP */}
                                            <td className="border-b p-2 text-right">
                                                <span
                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                >
                                                    {row.DP}
                                                </span>
                                            </td>

                                            {/* FP */}
                                            <td className="border-b p-2 text-right">
                                                <span
                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                >
                                                    {row.FP}
                                                </span>
                                            </td>

                                            {/* WA */}
                                            <td className="border-b p-2 text-right">
                                                <span
                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                >
                                                    {row.WPA}
                                                </span>
                                            </td>

                                            {/* BRS */}
                                            <td className="border-b p-2 text-right">
                                                <span
                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                >
                                                    {row.BRS}
                                                </span>
                                            </td>

                                            {/* CA */}
                                            <td className="border-b p-2 text-right">
                                                <span
                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                >
                                                    {row.CA}
                                                </span>
                                            </td>

                                            {/* RF */}
                                            <td className="border-b p-2 text-right">
                                                <span
                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                >
                                                    {row.RF}
                                                </span>
                                            </td>

                                            {/* EX */}
                                            <td className="border-b p-2 text-right">
                                                <span
                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                >
                                                    {row.EX}
                                                </span>
                                            </td>

                                            {/* WL */}
                                            <td className="border-b p-2 text-right">
                                                <span
                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                >
                                                    {row.WL}
                                                </span>
                                            </td>

                                            {/* available */}
                                            <td className="border-b p-2 text-right">
                                                <span
                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold ${
                                                        row.available <= 0
                                                            ? 'bg-red-100 text-red-600'
                                                            : row.available <= 5
                                                              ? 'bg-yellow-100 text-yellow-700'
                                                              : 'bg-green-100 text-green-700'
                                                    }`}
                                                >
                                                    {row.available}
                                                </span>
                                            </td>
                                            <td className="sticky right-0 z-20 bg-background border-b p-2">
                                                <div className="relative z-50 flex justify-end">
                                                    <DropdownMenu modal={false}>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>

                                                        <DropdownMenuContent
                                                            align="end"
                                                            sideOffset={5}
                                                            className="w-52 rounded-xl shadow-lg"
                                                        >
                                                            <DropdownMenuItem
                                                                className="cursor-pointer"
                                                                disabled={
                                                                    savingAvailability
                                                                }
                                                                onClick={() => {
                                                                    handleAvailabilitySave(
                                                                        row,
                                                                    );
                                                                }}
                                                            >
                                                                {savingAvailability ? (
                                                                    <Spinner className="mr-2 h-4 w-4" />
                                                                ) : (
                                                                    <Save className="mr-2 h-4 w-4" />
                                                                )}
                                                                <FormattedMessage defaultMessage="Save Availability" />
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                        {hasStatus && (
                                            <tr
                                                className={`hover:bg-muted/40 transition-colors ${bgClass}`}
                                            >
                                                <td
                                                    colSpan={3}
                                                    className={`sticky left-0 z-20 border-b px-3 pb-3 pt-2 align-middle ${bgClass === 'bg-muted/20' ? 'bg-muted/20' : 'bg-background'}`}
                                                >
                                                    <div className="flex justify-center w-full">
                                                        <div className="flex items-center justify-center gap-4 rounded-md border bg-background/50 px-4 py-1.5 shadow-sm w-max whitespace-nowrap">
                                                            {status.kind ===
                                                            'scheduled' ? (
                                                                <>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                                                                            {status.isDue
                                                                                ? 'Pending'
                                                                                : 'Queued'}
                                                                        </span>
                                                                        <span className="text-xs font-semibold text-foreground">
                                                                            RS{' '}
                                                                            {
                                                                                status.configuredValue
                                                                            }
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            &bull;{' '}
                                                                            {status.isDue
                                                                                ? 'Waiting for next scheduler run'
                                                                                : `Start ${formatManualReservedDateTime(status.startAt.toISOString())}`}
                                                                        </span>
                                                                    </div>
                                                                    <div className="h-4 w-px bg-border"></div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                                                                        onClick={() =>
                                                                            handleManualReservedReset(
                                                                                row,
                                                                            )
                                                                        }
                                                                    >
                                                                        <RefreshCw className="h-3 w-3" />
                                                                    </Button>
                                                                </>
                                                            ) : null}
                                                            {status.kind ===
                                                            'active_timed' ? (
                                                                <>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                                                                            Countdown
                                                                        </span>
                                                                        <span className="text-xs font-semibold text-foreground">
                                                                            {formatManualReservedCountdown(
                                                                                status.expiresAt,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div className="h-4 w-px bg-border"></div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                                                                        onClick={() =>
                                                                            handleManualReservedReset(
                                                                                row,
                                                                            )
                                                                        }
                                                                    >
                                                                        <RefreshCw className="h-3 w-3" />
                                                                    </Button>
                                                                </>
                                                            ) : null}
                                                            {status.kind ===
                                                            'active_open' ? (
                                                                <>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-700">
                                                                            Active
                                                                        </span>
                                                                        <span className="text-xs font-semibold text-foreground">
                                                                            RS{' '}
                                                                            {
                                                                                status.configuredValue
                                                                            }
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            &bull;
                                                                            Start{' '}
                                                                            {status.startAt
                                                                                ? formatManualReservedDateTime(
                                                                                      status.startAt.toISOString(),
                                                                                  )
                                                                                : '-'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="h-4 w-px bg-border"></div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                                                                        onClick={() =>
                                                                            handleManualReservedReset(
                                                                                row,
                                                                            )
                                                                        }
                                                                    >
                                                                        <RefreshCw className="h-3 w-3" />
                                                                    </Button>
                                                                </>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td
                                                    colSpan={11}
                                                    className="border-b p-0"
                                                ></td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="flex items-center justify-between border-t px-4 py-3">
                        <div className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                            >
                                <FormattedMessage defaultMessage="Previous" />
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                            >
                                <FormattedMessage defaultMessage="Next" />
                            </Button>
                        </div>
                    </div>
                </div>
                {/* MOBILE */}
                <div className="md:hidden space-y-4">
                    {paginatedAvailability.map((row, i) => {
                        const actualIndex = (currentPage - 1) * pageSize + i;

                        return (
                            <div
                                key={row.id ?? `new-${i}`}
                                className="border rounded-xl p-4 space-y-3 shadow-sm"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-semibold text-sm">
                                            {row.schedule}
                                        </div>

                                        <div
                                            className={`text-sm font-semibold ${
                                                row.available <= 0
                                                    ? 'text-red-500'
                                                    : 'text-green-600'
                                            }`}
                                        >
                                            <FormattedMessage
                                                defaultMessage="{count} pax"
                                                values={{
                                                    count: row.available,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Action */}
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
                                            className="w-52 rounded-xl shadow-lg"
                                        >
                                            <DropdownMenuItem
                                                className="cursor-pointer"
                                                disabled={savingAvailability}
                                                onClick={() => {
                                                    handleAvailabilitySave(
                                                        availability[
                                                            actualIndex
                                                        ],
                                                    );
                                                }}
                                            >
                                                {savingAvailability ? (
                                                    <Spinner className="mr-2 h-4 w-4" />
                                                ) : (
                                                    <Save className="mr-2 h-4 w-4" />
                                                )}
                                                <FormattedMessage defaultMessage="Save Availability" />
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Input grid */}
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {AVAILABILITY_MOBILE_FIELDS.map((field) => (
                                        <Fragment key={field.key}>
                                            <div className="text-muted-foreground">
                                                {field.label}
                                            </div>

                                            <MoneyInput
                                                className="text-right"
                                                value={row[field.key]}
                                                onChange={(val) =>
                                                    updateAvailability(
                                                        actualIndex,
                                                        field.key,
                                                        Number(val),
                                                    )
                                                }
                                            />
                                        </Fragment>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    <div className="mt-6 flex items-center justify-between border-t px-2 pt-4">
                        <div className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                            >
                                <FormattedMessage defaultMessage="Previous" />
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                            >
                                <FormattedMessage defaultMessage="Next" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-start pt-6"></div>
            <div className="mt-20 flex items-center justify-between px-4 py-3"></div>
        </TabsContent>
    );
}
