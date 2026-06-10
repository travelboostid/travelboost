import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatIDR } from '@/constants/booking';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import {
    approve,
    index as bookingModificationRequests,
    reject,
} from '@/routes/companies/dashboard/booking-modification-requests';
import { Head, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    CheckIcon,
    Clock3Icon,
    HistoryIcon,
    RotateCcwIcon,
    XIcon,
} from 'lucide-react';
import { useState } from 'react';

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
    canReviewRequests: boolean;
    actionRequiredCounts: ActionCounts;
};

const tabs = [
    {
        value: 'cancel',
        label: 'Cancellations',
        countKey: 'cancellations',
        icon: XIcon,
    },
    {
        value: 'refund',
        label: 'Refunds',
        countKey: 'refunds',
        icon: RotateCcwIcon,
    },
    {
        value: 'reschedule',
        label: 'Reschedules',
        countKey: 'reschedules',
        icon: Clock3Icon,
    },
    {
        value: 'restore',
        label: 'Reactivation',
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

function paginationLabel(label: string): string {
    return label
        .replace('&laquo; Previous', 'Previous')
        .replace('Next &raquo;', 'Next')
        .replace('&laquo;', 'Previous')
        .replace('&raquo;', 'Next');
}

export default function Page({
    requests,
    activeAction,
    canReviewRequests,
    actionRequiredCounts,
}: PageProps) {
    const { company } = usePageSharedDataProps() as {
        company: { username: string };
    };
    const [processingId, setProcessingId] = useState<number | null>(null);

    const activeTab = tabs.find((tab) => tab.value === activeAction) ?? tabs[0];

    const handleActionChange = (value: string) => {
        const nextAction = value as ActionKey;
        const routeDefinition = bookingModificationRequests(
            { company: company.username },
            nextAction === 'cancel'
                ? undefined
                : { query: { action: nextAction } },
        );

        router.get(
            routeDefinition.url,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const submitDecision = (
        requestId: number,
        decision: 'approve' | 'reject',
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
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            },
        );
    };

    return (
        <CompanyDashboardLayout
            openMenuIds={['tours']}
            activeMenuIds={['tours.booking-modification-requests']}
            breadcrumb={[{ title: 'Tours' }, { title: 'Booking Correction' }]}
        >
            <Head title="Booking Correction" />

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
                <Tabs
                    value={activeAction}
                    onValueChange={handleActionChange}
                    className="gap-4"
                >
                    <TabsList className="mx-auto grid !h-auto w-full max-w-[360px] grid-cols-2 gap-2 overflow-visible bg-transparent p-0 md:inline-flex md:w-auto md:max-w-none md:gap-1.5">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const count =
                                actionRequiredCounts[tab.countKey] ?? 0;

                            return (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="!h-8 rounded-full border border-border bg-background px-2.5 text-[0.72rem] leading-none shadow-sm data-[state=active]:border-primary/40 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none sm:text-xs md:flex-none md:px-3"
                                >
                                    <Icon className="size-3.5" />
                                    <span>{tab.label}</span>
                                    {canReviewRequests && count > 0 && (
                                        <span className="ml-0.5 inline-flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-1.5 text-[0.62rem] font-semibold leading-none text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
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
                            emptyLabel={`No ${activeTab.label.toLowerCase()} yet.`}
                            canReviewRequests={canReviewRequests}
                            processingId={processingId}
                            onSubmitDecision={submitDecision}
                        />
                    </TabsContent>
                </Tabs>
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
}: {
    requests: PaginatedActionRequests;
    emptyLabel: string;
    canReviewRequests: boolean;
    processingId: number | null;
    onSubmitDecision: (
        requestId: number,
        decision: 'approve' | 'reject',
    ) => void;
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
                of{' '}
                <span className="font-semibold text-foreground">
                    {requests.total}
                </span>{' '}
                request(s)
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
                            {paginationLabel(link.label)}
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
}: {
    request: ActionRequest;
    canReviewRequests: boolean;
    processingId: number | null;
    onSubmitDecision: (
        requestId: number,
        decision: 'approve' | 'reject',
    ) => void;
}) {
    const canReview = canReviewRequests && request.status === 'pending';
    const reviewedBy = reviewerText(request);

    return (
        <div className="grid gap-4 rounded-lg border bg-card p-4 shadow-sm md:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge
                        variant="outline"
                        className="border-slate-200 bg-slate-50 text-slate-600 capitalize dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300"
                    >
                        {request.target_action}
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
                        {request.booking?.tour?.name ?? 'Untitled tour'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {request.booking?.contact_name ?? 'Booking contact'} -{' '}
                        {request.requester_company?.name ?? 'Agent'} -{' '}
                        {formatDate(request.created_at)}
                    </p>
                </div>

                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    <MetaValue
                        label="Booking status"
                        value={request.booking?.status ?? '-'}
                    />
                    <MetaValue
                        label="Departure"
                        value={formatDate(request.booking?.departure_date)}
                    />
                    <MetaValue
                        label="Grand total"
                        value={formatIDR(request.booking?.grand_total ?? 0)}
                    />
                </div>

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
                        Reject
                    </Button>
                    <Button
                        type="button"
                        className="gap-2"
                        disabled={processingId === request.id}
                        onClick={() => onSubmitDecision(request.id, 'approve')}
                    >
                        <CheckIcon className="size-4" />
                        Approve
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
