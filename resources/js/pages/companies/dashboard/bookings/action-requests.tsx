import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatIDR } from '@/constants/booking';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import {
    CorrectionChangeSummary,
    type CorrectionPayload,
} from '@/pages/companies/dashboard/bookings/components/booking-correction/correction-change-summary';
import { actionBadgeClassName } from '@/pages/companies/dashboard/bookings/components/booking-correction/correction-summary-cards';
import ReschedulePriceAdjustmentField from '@/pages/companies/dashboard/bookings/components/booking-correction/reschedule-price-adjustment-field';
import {
    approve,
    index as bookingCorrectionRoute,
    reject,
} from '@/routes/companies/dashboard/booking-correction/index';
import { Head, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    CheckIcon,
    Clock3Icon,
    HistoryIcon,
    RotateCcwIcon,
    SearchIcon,
    XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

type ActionKey = 'cancel' | 'refund' | 'reschedule' | 'restore';

type ActionCounts = {
    cancellations: number;
    refunds: number;
    reschedules: number;
    restores: number;
    total: number;
};

type ActionRequest = {
    id: number;
    target_action: ActionKey;
    status: 'pending' | 'approved' | 'rejected' | string;
    reason: string | null;
    payload?: CorrectionPayload;
    created_at: string | null;
    booking: {
        id: number;
        booking_number: string;
        contact_name: string | null;
        status: string;
        grand_total: string | number | null;
        departure_date: string | null;
        tour: { id: number; name: string; code: string | null } | null;
    } | null;
    requester_company: { id: number; name: string; username: string } | null;
    requester_user: { id: number; name: string; email: string } | null;
    reviewer: {
        user_name: string;
        company_name: string | null;
        role_label: string;
        action_label: string;
        reviewed_at: string | null;
    } | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedActionRequests = {
    data: ActionRequest[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
};

type PageProps = {
    requests: PaginatedActionRequests;
    activeAction: ActionKey;
    search: string;
    canReviewRequests: boolean;
    actionRequiredCounts: ActionCounts;
};

const tabDefinitions = [
    {
        value: 'cancel',
        id: 'companies.dashboard.bookingCorrection.tabs.cancellations',
        defaultMessage: 'Cancellations',
        countKey: 'cancellations',
        icon: XIcon,
    },
    {
        value: 'refund',
        id: 'companies.dashboard.bookingCorrection.tabs.refunds',
        defaultMessage: 'Refunds',
        countKey: 'refunds',
        icon: RotateCcwIcon,
    },
    {
        value: 'reschedule',
        id: 'companies.dashboard.bookingCorrection.tabs.reschedules',
        defaultMessage: 'Reschedules',
        countKey: 'reschedules',
        icon: Clock3Icon,
    },
    {
        value: 'restore',
        id: 'companies.dashboard.bookingCorrection.tabs.reactivation',
        defaultMessage: 'Reactivation',
        countKey: 'restores',
        icon: HistoryIcon,
    },
] as const;

function statusBadgeClassName(status: string) {
    if (status === 'approved') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300';
    }

    if (status === 'rejected') {
        return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300';
    }

    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300';
}

function formatDate(value: string | null | undefined, format = 'DD MMM YYYY') {
    return value ? dayjs(value).format(format) : '-';
}

function reviewerText(request: ActionRequest) {
    if (!request.reviewer) {
        return null;
    }

    return `${request.reviewer.action_label} ${request.reviewer.role_label} (${request.reviewer.user_name})`;
}

function paginationLabel(
    label: string,
    intl: ReturnType<typeof useIntl>,
): string {
    return label
        .replace(
            '&laquo; Previous',
            intl.formatMessage({
                id: 'pagination.previous',
                defaultMessage: 'Previous',
            }),
        )
        .replace(
            'Next &raquo;',
            intl.formatMessage({
                id: 'pagination.next',
                defaultMessage: 'Next',
            }),
        )
        .replace(
            '&laquo;',
            intl.formatMessage({
                id: 'pagination.previous',
                defaultMessage: 'Previous',
            }),
        )
        .replace(
            '&raquo;',
            intl.formatMessage({
                id: 'pagination.next',
                defaultMessage: 'Next',
            }),
        );
}

export default function Page({
    requests,
    activeAction,
    search,
    canReviewRequests,
    actionRequiredCounts,
}: PageProps) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps() as {
        company: { username: string };
    };
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [globalFilter, setGlobalFilter] = useState(search);
    const [approveDialogRequest, setApproveDialogRequest] =
        useState<ActionRequest | null>(null);
    const [applyCustomerPriceAdjustment, setApplyCustomerPriceAdjustment] =
        useState(true);

    const tabs = useMemo(
        () =>
            tabDefinitions.map((tab) => ({
                ...tab,
                label: intl.formatMessage({
                    id: tab.id,
                    defaultMessage: tab.defaultMessage,
                }),
            })),
        [intl],
    );

    const activeTab = tabs.find((tab) => tab.value === activeAction) ?? tabs[0];

    const buildIndexRoute = useCallback(
        (action: ActionKey, keyword: string) => {
            const query: Record<string, string> = {};
            const normalizedKeyword = keyword.trim();

            if (action !== 'cancel') {
                query.action = action;
            }

            if (normalizedKeyword !== '') {
                query.search = normalizedKeyword;
            }

            return bookingCorrectionRoute(
                { company: company.username },
                Object.keys(query).length > 0 ? { query } : undefined,
            );
        },
        [company.username],
    );

    const visitRequests = useCallback(
        (action: ActionKey, keyword: string) => {
            const routeDefinition = buildIndexRoute(action, keyword);

            router.get(
                routeDefinition.url,
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                },
            );
        },
        [buildIndexRoute],
    );

    useEffect(() => {
        setGlobalFilter(search);
    }, [search]);

    useEffect(() => {
        const normalizedKeyword = globalFilter.trim();

        if (normalizedKeyword === search.trim()) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            visitRequests(activeAction, normalizedKeyword);
        }, 400);

        return () => window.clearTimeout(timeoutId);
    }, [activeAction, globalFilter, search, visitRequests]);

    const handleActionChange = (value: string) => {
        visitRequests(value as ActionKey, globalFilter);
    };

    const handleClearSearch = () => {
        setGlobalFilter('');
        visitRequests(activeAction, '');
    };

    const emptyLabel =
        search.trim() === ''
            ? intl.formatMessage(
                  {
                      id: 'companies.dashboard.bookingCorrection.empty.default',
                      defaultMessage: 'No {action} yet.',
                  },
                  { action: activeTab.label.toLowerCase() },
              )
            : intl.formatMessage(
                  {
                      id: 'companies.dashboard.bookingCorrection.empty.search',
                      defaultMessage: 'No {action} match your search.',
                  },
                  { action: activeTab.label.toLowerCase() },
              );

    const submitDecision = (
        requestId: number,
        decision: 'approve' | 'reject',
        options?: { applyCustomerPriceAdjustment?: boolean },
    ) => {
        const routeDefinition =
            decision === 'approve'
                ? approve({
                      company: company.username,
                      bookingActionRequest: requestId,
                  })
                : reject({
                      company: company.username,
                      bookingActionRequest: requestId,
                  });

        setProcessingId(requestId);
        router.post(
            routeDefinition.url,
            decision === 'approve' && options
                ? {
                      apply_customer_price_adjustment:
                          options.applyCustomerPriceAdjustment ?? true,
                  }
                : {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (decision === 'approve') {
                        setApproveDialogRequest(null);
                        setApplyCustomerPriceAdjustment(true);
                    }
                },
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const handleApproveClick = (request: ActionRequest) => {
        const priceDifference = Number(request.payload?.price_difference ?? 0);

        if (
            canReviewRequests &&
            request.target_action === 'reschedule' &&
            Math.abs(priceDifference) > 0.01
        ) {
            setApplyCustomerPriceAdjustment(true);
            setApproveDialogRequest(request);
            return;
        }

        submitDecision(request.id, 'approve');
    };

    return (
        <CompanyDashboardLayout
            openMenuIds={['tours']}
            activeMenuIds={['tours.booking-correction']}
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        id: 'companies.dashboard.bookingCorrection.breadcrumb.tours',
                        defaultMessage: 'Tours',
                    }),
                },
                {
                    title: intl.formatMessage({
                        id: 'companies.dashboard.bookingCorrection.title',
                        defaultMessage: 'Booking Correction',
                    }),
                },
            ]}
        >
            <Head
                title={intl.formatMessage({
                    id: 'companies.dashboard.bookingCorrection.title',
                    defaultMessage: 'Booking Correction',
                })}
            />

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
                <Tabs
                    value={activeAction}
                    onValueChange={handleActionChange}
                    className="gap-4"
                >
                    <div className="mx-auto w-full max-w-3xl">
                        <div className="relative">
                            <span className="pointer-events-none absolute left-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 dark:bg-primary/15">
                                <SearchIcon className="size-3.5" />
                            </span>
                            <Input
                                type="text"
                                value={globalFilter}
                                onChange={(event) =>
                                    setGlobalFilter(event.target.value)
                                }
                                placeholder={intl.formatMessage({
                                    id: 'companies.dashboard.bookingCorrection.search.placeholder',
                                    defaultMessage:
                                        'Search tour, booking ID, departure, customer, agent',
                                })}
                                className="h-9 w-full rounded-lg border-slate-200 bg-background pl-9 pr-9 text-xs font-medium shadow-inner shadow-slate-100/70 transition-all placeholder:text-[13px] placeholder:font-normal placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:shadow-black/20 dark:placeholder:text-slate-500"
                            />
                            {globalFilter.trim() !== '' && (
                                <button
                                    type="button"
                                    aria-label={intl.formatMessage({
                                        id: 'companies.dashboard.bookingCorrection.search.clear',
                                        defaultMessage: 'Clear search',
                                    })}
                                    onClick={handleClearSearch}
                                    className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <XIcon className="size-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <TabsList className="mx-auto flex !h-auto w-fit max-w-full gap-1.5 overflow-x-auto bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const count =
                                actionRequiredCounts[tab.countKey] ?? 0;

                            return (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="!h-7 shrink-0 rounded-full border border-border bg-background px-2 text-[0.68rem] leading-none shadow-sm data-[state=active]:border-primary/40 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none sm:px-2.5 sm:text-[0.72rem]"
                                >
                                    <Icon className="size-3" />
                                    <span>{tab.label}</span>
                                    {canReviewRequests && count > 0 && (
                                        <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-1 text-[0.58rem] font-semibold leading-none text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                                            {count > 99 ? '99+' : count}
                                        </span>
                                    )}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    <TabsContent value={activeAction} className="mt-1">
                        <RequestList
                            requests={requests}
                            emptyLabel={emptyLabel}
                            canReviewRequests={canReviewRequests}
                            processingId={processingId}
                            onSubmitDecision={submitDecision}
                            onApproveClick={handleApproveClick}
                        />
                    </TabsContent>
                </Tabs>

                <Dialog
                    open={approveDialogRequest !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setApproveDialogRequest(null);
                            setApplyCustomerPriceAdjustment(true);
                        }
                    }}
                >
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                <FormattedMessage defaultMessage="Approve reschedule" />
                            </DialogTitle>
                            <DialogDescription>
                                <FormattedMessage defaultMessage="Confirm how the price difference should be handled before rescheduling this booking." />
                            </DialogDescription>
                        </DialogHeader>

                        {approveDialogRequest && (
                            <div className="space-y-3">
                                <CorrectionChangeSummary
                                    targetAction="reschedule"
                                    currentDeparture={
                                        approveDialogRequest.booking
                                            ?.departure_date ?? null
                                    }
                                    payload={
                                        approveDialogRequest.payload ?? null
                                    }
                                />
                                <ReschedulePriceAdjustmentField
                                    priceDifference={Number(
                                        approveDialogRequest.payload
                                            ?.price_difference ?? 0,
                                    )}
                                    value={applyCustomerPriceAdjustment}
                                    onChange={setApplyCustomerPriceAdjustment}
                                />
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setApproveDialogRequest(null)}
                            >
                                <FormattedMessage defaultMessage="Cancel" />
                            </Button>
                            <Button
                                type="button"
                                disabled={
                                    processingId === approveDialogRequest?.id
                                }
                                onClick={() => {
                                    if (!approveDialogRequest) {
                                        return;
                                    }

                                    submitDecision(
                                        approveDialogRequest.id,
                                        'approve',
                                        {
                                            applyCustomerPriceAdjustment,
                                        },
                                    );
                                }}
                            >
                                <FormattedMessage defaultMessage="Confirm approval" />
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </CompanyDashboardLayout>
    );
}

function RequestList({
    requests,
    emptyLabel,
    canReviewRequests,
    processingId,
    onSubmitDecision,
    onApproveClick,
}: {
    requests: PaginatedActionRequests;
    emptyLabel: string;
    canReviewRequests: boolean;
    processingId: number | null;
    onSubmitDecision: (
        requestId: number,
        decision: 'approve' | 'reject',
        options?: { applyCustomerPriceAdjustment?: boolean },
    ) => void;
    onApproveClick: (request: ActionRequest) => void;
}) {
    if (requests.data.length === 0) {
        return (
            <div className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                {emptyLabel}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {requests.data.map((request) => (
                    <RequestRow
                        key={request.id}
                        request={request}
                        canReviewRequests={canReviewRequests}
                        processingId={processingId}
                        onSubmitDecision={onSubmitDecision}
                        onApproveClick={onApproveClick}
                    />
                ))}
            </div>
            <RequestPagination requests={requests} />
        </div>
    );
}

function RequestPagination({
    requests,
}: {
    requests: PaginatedActionRequests;
}) {
    const intl = useIntl();

    if (requests.total === 0) {
        return null;
    }

    return (
        <div className="flex flex-col items-center justify-between gap-3 pt-1 sm:flex-row">
            <p className="rounded-md border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm text-muted-foreground dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <span className="font-semibold text-foreground">
                    {requests.from ?? 0}
                </span>{' '}
                -{' '}
                <span className="font-semibold text-foreground">
                    {requests.to ?? 0}
                </span>{' '}
                <FormattedMessage id="pagination.of" defaultMessage="of" />{' '}
                <span className="font-semibold text-foreground">
                    {requests.total}
                </span>{' '}
                <FormattedMessage
                    id="companies.dashboard.bookingCorrection.pagination.requests"
                    defaultMessage="request(s)"
                />
            </p>

            {requests.last_page > 1 && (
                <div className="flex flex-wrap justify-center gap-2">
                    {requests.links.map((link, index) => (
                        <Button
                            key={`${link.label}-${index}`}
                            type="button"
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                if (link.url) {
                                    router.visit(link.url, {
                                        preserveScroll: true,
                                        preserveState: true,
                                    });
                                }
                            }}
                            disabled={!link.url}
                            className="min-w-9 border-slate-200"
                        >
                            {paginationLabel(link.label, intl)}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}

function RequestRow({
    request,
    canReviewRequests,
    processingId,
    onSubmitDecision,
    onApproveClick,
}: {
    request: ActionRequest;
    canReviewRequests: boolean;
    processingId: number | null;
    onSubmitDecision: (
        requestId: number,
        decision: 'approve' | 'reject',
        options?: { applyCustomerPriceAdjustment?: boolean },
    ) => void;
    onApproveClick: (request: ActionRequest) => void;
}) {
    const intl = useIntl();
    const canReview = canReviewRequests && request.status === 'pending';
    const reviewedBy = reviewerText(request);

    return (
        <div className="grid gap-4 rounded-lg border bg-card p-4 shadow-sm md:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge
                        variant="outline"
                        className={actionBadgeClassName(request.target_action)}
                    >
                        {request.target_action === 'restore'
                            ? intl.formatMessage({
                                  defaultMessage: 'reactivation',
                              })
                            : request.target_action}
                    </Badge>
                    <Badge
                        variant="outline"
                        className={cn(
                            'capitalize',
                            statusBadgeClassName(request.status),
                        )}
                    >
                        {request.status}
                    </Badge>
                    <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {request.booking?.booking_number ?? '-'}
                    </span>
                </div>

                <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-foreground">
                        {request.booking?.tour?.name ??
                            intl.formatMessage({
                                id: 'companies.dashboard.bookingCorrection.fallback.untitledTour',
                                defaultMessage: 'Untitled tour',
                            })}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {request.booking?.contact_name ??
                            intl.formatMessage({
                                id: 'companies.dashboard.bookingCorrection.fallback.bookingContact',
                                defaultMessage: 'Booking contact',
                            })}{' '}
                        -{' '}
                        {request.requester_company?.name ??
                            intl.formatMessage({
                                id: 'companies.dashboard.bookingCorrection.fallback.agent',
                                defaultMessage: 'Agent',
                            })}{' '}
                        - {formatDate(request.created_at)}
                    </p>
                </div>

                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    <MetaValue
                        label={intl.formatMessage({
                            id: 'companies.dashboard.bookingCorrection.meta.bookingStatus',
                            defaultMessage: 'Booking status',
                        })}
                        value={request.booking?.status ?? '-'}
                    />
                    <MetaValue
                        label={intl.formatMessage({
                            id: 'companies.dashboard.bookingCorrection.meta.departure',
                            defaultMessage: 'Departure',
                        })}
                        value={formatDate(request.booking?.departure_date)}
                    />
                    <MetaValue
                        label={intl.formatMessage({
                            id: 'companies.dashboard.bookingCorrection.meta.grandTotal',
                            defaultMessage: 'Grand total',
                        })}
                        value={formatIDR(request.booking?.grand_total ?? 0)}
                    />
                </div>

                <CorrectionChangeSummary
                    targetAction={request.target_action}
                    payload={request.payload ?? null}
                    currentDeparture={request.booking?.departure_date ?? null}
                />

                {request.reason && (
                    <p className="break-words rounded-md bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                        {request.reason}
                    </p>
                )}

                {canReviewRequests && reviewedBy && (
                    <div className="rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                            {reviewedBy}
                        </span>
                        {request.reviewer?.company_name && (
                            <span> - {request.reviewer.company_name}</span>
                        )}
                        {request.reviewer?.reviewed_at && (
                            <span>
                                {' '}
                                -{' '}
                                {formatDate(
                                    request.reviewer.reviewed_at,
                                    'DD MMM YYYY HH:mm',
                                )}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {canReview && (
                <div className="grid grid-cols-2 gap-2 lg:w-52">
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        disabled={processingId === request.id}
                        onClick={() => onSubmitDecision(request.id, 'reject')}
                    >
                        <XIcon className="size-4" />
                        <FormattedMessage
                            id="companies.dashboard.bookingCorrection.actions.reject"
                            defaultMessage="Reject"
                        />
                    </Button>
                    <Button
                        type="button"
                        className="gap-2"
                        disabled={processingId === request.id}
                        onClick={() => onApproveClick(request)}
                    >
                        <CheckIcon className="size-4" />
                        <FormattedMessage
                            id="companies.dashboard.bookingCorrection.actions.approve"
                            defaultMessage="Approve"
                        />
                    </Button>
                </div>
            )}
        </div>
    );
}

function MetaValue({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0 rounded-md bg-muted/40 px-3 py-2">
            <span className="block text-[0.68rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {label}
            </span>
            <span className="mt-0.5 block break-words font-semibold text-foreground">
                {value}
            </span>
        </div>
    );
}
