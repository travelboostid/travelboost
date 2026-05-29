import type { TourResource } from '@/api/model';
import { Badge } from '@/components/ui/badge';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    BOOKING_STATUS_CONFIG,
    formatCurrency,
    formatDate,
} from '@/constants/booking';
import { cn } from '@/lib/utils';
import type {
    BookingPricing,
    BookingStatusCode,
    VendorInfo,
} from '@/types/booking';
import {
    CheckIcon,
    ChevronsUpDownIcon,
    ClockIcon,
    MapPinIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

function PriceText({ value }: { value: number }) {
    return <span>{formatCurrency(value)}</span>;
}

type AgentOption = {
    id: number;
    name: string;
    username: string;
    email?: string | null;
};

type BookingInfoCardProps = {
    tour: TourResource;
    status: BookingStatusCode;
    bookingNumber: string | null;
    invoiceNumber?: string | null;
    departureDate: string;
    vendor: VendorInfo;
    agentName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    pricing: BookingPricing;
    timeLeftSeconds?: number;
    currentStep?: number;
    displayTotalPrice?: number;
    totalPaid?: number;
    remainingBalance?: number;
    agentCommissionAmount?: number;
    showAgentCommission?: boolean;
    agentOptions?: AgentOption[];
    selectedAgentId?: number | null;
    onAgentChange?: (agentId: number | null) => void;
    requiresAgentSelection?: boolean;
    agentSelectionError?: string | null;
    agentSelectionDisabled?: boolean;
    inputBy?: {
        userName: string;
        roleLabel: string;
        companyName?: string | null;
        createdAt: string | null;
    } | null;
    timerStarted?: boolean;
};

export default function BookingInfoCard({
    tour,
    status,
    bookingNumber,
    invoiceNumber,
    departureDate,
    vendor,
    agentName,
    contactName,
    contactEmail,
    contactPhone,
    pricing,
    timeLeftSeconds,
    currentStep = 1,
    displayTotalPrice,
    totalPaid = 0,
    remainingBalance = 0,
    agentCommissionAmount = 0,
    showAgentCommission = false,
    agentOptions = [],
    selectedAgentId = null,
    onAgentChange,
    requiresAgentSelection = false,
    agentSelectionError = null,
    agentSelectionDisabled = false,
    inputBy = null,
    timerStarted = false,
}: BookingInfoCardProps) {
    const [agentPopoverOpen, setAgentPopoverOpen] = useState(false);
    const normalizeStatus = (s: string): BookingStatusCode => {
        const map: Record<string, BookingStatusCode> = {
            'awaiting payment': 'waiting_payment',
            awaiting_payment: 'waiting_payment',
            'waiting payment approval': 'waiting_payment_approval',
            waiting_payment_approval: 'waiting_payment_approval',
            'down payment': 'down_payment',
            'full payment': 'full_payment',
            'waiting list': 'waiting_list',
            waiting_list: 'waiting_list',
            'booking reserved': 'booking_reserved',
            booking_reserved: 'booking_reserved',
            'manual reserved': 'manual_reserved',
            manual_reserved: 'manual_reserved',
            cancelled: 'cancel',
            refunded: 'refund',
        };
        const key = s.toLowerCase();
        return map[key] ?? (key as BookingStatusCode);
    };

    const statusConfig =
        BOOKING_STATUS_CONFIG[normalizeStatus(status)] ??
        BOOKING_STATUS_CONFIG.reserved;
    const cardTimerSeconds =
        typeof timeLeftSeconds === 'number' ? timeLeftSeconds : null;
    const shouldShowCardTimer =
        cardTimerSeconds !== null && (timerStarted || currentStep >= 2);
    const timerColor =
        cardTimerSeconds !== null && cardTimerSeconds < 300
            ? 'text-destructive animate-pulse'
            : 'text-primary';

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;

        return `${min.toString().padStart(2, '0')}:${sec
            .toString()
            .padStart(2, '0')}`;
    };

    const selectedAgent = useMemo(
        () =>
            agentOptions.find(
                (agentOption) => agentOption.id === selectedAgentId,
            ) ?? null,
        [agentOptions, selectedAgentId],
    );

    const inputByText = inputBy
        ? [
              `${inputBy.roleLabel}${inputBy.companyName ? ` ${inputBy.companyName}` : ''} (${inputBy.userName})`,
              inputBy.createdAt
                  ? new Date(inputBy.createdAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })
                  : null,
          ]
              .filter(Boolean)
              .join(' - ')
        : null;

    return (
        <div className="rounded-xl border bg-card p-3 text-sm shadow-sm ring-1 ring-primary/5">
            {/* Tour Header */}
            <div className="mb-3 flex flex-col justify-between gap-2 border-b border-border/50 pb-3 sm:flex-row sm:items-start">
                <div>
                    <h1 className="text-lg font-bold leading-tight text-foreground">
                        {tour.code || 'N/A'} - {tour.name}
                    </h1>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
                            <ClockIcon className="size-3.5 stroke-[2.5]" />
                            <span>{tour.duration_days} days</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
                            <MapPinIcon className="size-3.5 stroke-[2.5]" />
                            <span>{tour.destination}</span>
                        </div>
                    </div>
                </div>
                {shouldShowCardTimer && cardTimerSeconds !== null && (
                    <div
                        className="flex flex-col text-left sm:items-end sm:text-right"
                        role="timer"
                        aria-live="polite"
                        aria-label={`Time remaining: ${formatTime(cardTimerSeconds)}`}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Time Left
                        </span>
                        <div
                            className={`mt-1 flex items-center gap-1.5 font-mono text-xl font-bold leading-none ${timerColor}`}
                        >
                            <ClockIcon className="size-5" />
                            <span>{formatTime(cardTimerSeconds)}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* Booking Info */}
                <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Booking Info
                    </p>
                    <div className="space-y-1 text-xs sm:text-sm">
                        <p className="flex justify-between md:block">
                            <span className="text-muted-foreground md:mr-2">
                                Booking Number:
                            </span>{' '}
                            <span className="font-semibold text-foreground">
                                {bookingNumber ?? 'TBA (Draft)'}
                            </span>
                        </p>
                        <p className="flex justify-between md:block">
                            <span className="text-muted-foreground md:mr-2">
                                Booking Time:
                            </span>{' '}
                            <span className="font-semibold text-foreground">
                                {new Date().toLocaleString('id-ID')}
                            </span>
                        </p>
                        <div className="mt-1 flex items-center justify-between md:justify-start">
                            <span className="text-muted-foreground md:mr-2">
                                Status:
                            </span>
                            <Badge
                                variant="secondary"
                                className={`px-2 py-0 text-[10px] font-bold uppercase tracking-wider ${statusConfig.bgClass} ${statusConfig.textClass}`}
                            >
                                {statusConfig.label}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Service Providers */}
                <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Service Providers
                    </p>
                    <div className="space-y-1 text-xs sm:text-sm">
                        <p className="flex justify-between md:block">
                            <span className="text-muted-foreground md:mr-2">
                                Vendor:
                            </span>{' '}
                            <span className="font-semibold text-foreground">
                                {vendor.name}
                            </span>
                        </p>
                        {requiresAgentSelection ? (
                            <div className="space-y-1.5">
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                                    <span className="shrink-0 text-muted-foreground">
                                        Agent:
                                    </span>
                                    <Popover
                                        open={agentPopoverOpen}
                                        onOpenChange={setAgentPopoverOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <button
                                                type="button"
                                                role="combobox"
                                                aria-expanded={agentPopoverOpen}
                                                disabled={
                                                    agentSelectionDisabled
                                                }
                                                className={cn(
                                                    'flex min-h-8 w-full items-center justify-between rounded-md border bg-background px-2.5 py-1.5 text-left text-xs font-semibold text-foreground shadow-sm transition-colors sm:w-[240px]',
                                                    'hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60',
                                                    agentSelectionError &&
                                                        'border-destructive/60',
                                                )}
                                            >
                                                <span className="min-w-0 truncate">
                                                    {selectedAgent
                                                        ? selectedAgent.name
                                                        : 'Select agent'}
                                                </span>
                                                <ChevronsUpDownIcon className="ml-2 size-3.5 shrink-0 opacity-50" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            align="start"
                                            className="w-[260px] p-0"
                                        >
                                            <Command>
                                                <CommandInput placeholder="Search agent..." />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        No active agents found.
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {agentOptions.map(
                                                            (agentOption) => (
                                                                <CommandItem
                                                                    key={
                                                                        agentOption.id
                                                                    }
                                                                    value={`${agentOption.name} ${agentOption.username} ${agentOption.email ?? ''}`}
                                                                    onSelect={() => {
                                                                        onAgentChange?.(
                                                                            agentOption.id,
                                                                        );
                                                                        setAgentPopoverOpen(
                                                                            false,
                                                                        );
                                                                    }}
                                                                >
                                                                    <span className="min-w-0 flex-1 truncate">
                                                                        {
                                                                            agentOption.name
                                                                        }
                                                                    </span>
                                                                    <CheckIcon
                                                                        className={cn(
                                                                            'ml-2 size-4 shrink-0',
                                                                            selectedAgentId ===
                                                                                agentOption.id
                                                                                ? 'opacity-100'
                                                                                : 'opacity-0',
                                                                        )}
                                                                    />
                                                                </CommandItem>
                                                            ),
                                                        )}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                {agentSelectionError && (
                                    <p className="text-xs font-semibold text-destructive">
                                        {agentSelectionError}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="flex justify-between md:block">
                                <span className="text-muted-foreground md:mr-2">
                                    Agent:
                                </span>{' '}
                                <span className="font-semibold text-foreground">
                                    {agentName}
                                </span>
                            </p>
                        )}
                        {inputByText && (
                            <p className="flex justify-between gap-2 md:block">
                                <span className="text-muted-foreground md:mr-2">
                                    Input by:
                                </span>{' '}
                                <span className="font-semibold text-foreground">
                                    {inputByText}
                                </span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Schedule */}
                <div className="border-t border-border/50 pt-2 md:col-span-2">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Schedule Details
                    </p>
                    <p className="text-xs sm:text-sm">
                        <span className="text-muted-foreground md:mr-2">
                            Departure Date:
                        </span>{' '}
                        <span className="font-semibold text-foreground">
                            {departureDate ? formatDate(departureDate) : '-'}
                        </span>
                    </p>
                </div>

                {/* Guest Info */}
                <div className="border-t border-border/50 pt-2 md:col-span-2">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Guest Information
                    </p>
                    <div className="grid grid-cols-1 gap-1 text-xs sm:text-sm md:grid-cols-3">
                        <p className="truncate">
                            <span className="text-muted-foreground md:mr-2">
                                Name:
                            </span>{' '}
                            <span className="font-semibold">
                                {contactName || '-'}
                            </span>
                        </p>
                        <p className="truncate">
                            <span className="text-muted-foreground md:mr-2">
                                Email:
                            </span>{' '}
                            <span className="font-semibold">
                                {contactEmail || '-'}
                            </span>
                        </p>
                        <p className="truncate">
                            <span className="text-muted-foreground md:mr-2">
                                Phone:
                            </span>{' '}
                            <span className="font-semibold">
                                {contactPhone || '-'}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Pricing */}
                <div className="border-t border-border/50 pt-2 md:col-span-2">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Pricing
                    </p>
                    <div className="grid grid-cols-1 gap-1 text-xs sm:text-sm md:grid-cols-3">
                        <p>
                            <span className="text-muted-foreground md:mr-2">
                                Total Price:
                            </span>{' '}
                            <span className="font-bold text-foreground">
                                <PriceText
                                    value={
                                        displayTotalPrice ??
                                        pricing.subtotalGuests
                                    }
                                />
                            </span>
                        </p>
                        <p>
                            <span className="text-muted-foreground md:mr-2">
                                Total Payment:
                            </span>{' '}
                            <span className="font-bold text-primary">
                                <PriceText value={totalPaid ?? 0} />
                            </span>
                        </p>
                        <p>
                            <span className="text-muted-foreground md:mr-2">
                                Remaining Balance:
                            </span>{' '}
                            <span className="font-bold text-foreground">
                                <PriceText value={remainingBalance ?? 0} />
                            </span>
                        </p>
                    </div>
                </div>

                {/* Invoice */}
                <div className="border-t border-border/50 pt-2 md:col-span-2">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Invoice
                    </p>
                    <div className="grid grid-cols-1 gap-1 text-xs sm:text-sm md:grid-cols-3">
                        <p
                            className={cn(
                                'min-w-0',
                                showAgentCommission
                                    ? 'md:col-span-2'
                                    : 'md:col-span-3',
                            )}
                        >
                            <span className="text-muted-foreground">
                                Invoice Number:
                            </span>{' '}
                            <span
                                className={cn(
                                    'break-words font-bold',
                                    invoiceNumber
                                        ? 'text-primary'
                                        : 'text-muted-foreground/60',
                                )}
                            >
                                {invoiceNumber || '-'}
                            </span>
                        </p>
                        {showAgentCommission && (
                            <p className="min-w-0">
                                <span className="text-muted-foreground md:mr-2">
                                    Commission:
                                </span>{' '}
                                <span className="font-bold text-primary">
                                    <PriceText value={agentCommissionAmount} />
                                </span>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
