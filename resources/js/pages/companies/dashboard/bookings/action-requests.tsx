import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatIDR } from '@/constants/booking';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Head, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import { CheckIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

type ActionRequest = {
    id: number;
    target_action: 'cancel' | 'refund';
    status: string;
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
};

type PageProps = {
    requests: {
        data: ActionRequest[];
    };
};

export default function Page({ requests }: PageProps) {
    const { company } = usePageSharedDataProps() as {
        company: { username: string };
    };
    const [processingId, setProcessingId] = useState<number | null>(null);

    const submitDecision = (
        requestId: number,
        decision: 'approve' | 'reject',
    ) => {
        setProcessingId(requestId);
        router.post(
            `/companies/${company.username}/dashboard/booking-action-requests/${requestId}/${decision}`,
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
            activeMenuIds={['tours.cancelation-refund']}
            breadcrumb={[
                { title: 'Tours' },
                { title: 'Cancelation and Refund' },
            ]}
        >
            <Head title="Cancelation and Refund" />

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="text-xl font-semibold">
                        Cancelation and Refund
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Review pending cancel and refund requests from agents.
                    </p>
                </div>

                <div className="overflow-hidden rounded-lg border bg-card">
                    {requests.data.length === 0 ? (
                        <div className="p-6 text-sm text-muted-foreground">
                            No pending requests.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {requests.data.map((request) => (
                                <div
                                    key={request.id}
                                    className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                                >
                                    <div className="min-w-0 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge
                                                variant="secondary"
                                                className="capitalize"
                                            >
                                                {request.target_action}
                                            </Badge>
                                            <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                                {request.booking
                                                    ?.booking_number ?? '-'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="truncate text-sm font-semibold">
                                                {request.booking?.tour?.name ??
                                                    'Untitled tour'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {request.booking
                                                    ?.contact_name ??
                                                    'Booking contact'}{' '}
                                                ·{' '}
                                                {request.requester_company
                                                    ?.name ?? 'Agent'}{' '}
                                                ·{' '}
                                                {request.created_at
                                                    ? dayjs(
                                                          request.created_at,
                                                      ).format('DD MMM YYYY')
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                                            <span>
                                                Status:{' '}
                                                <strong className="font-semibold text-foreground">
                                                    {request.booking?.status ??
                                                        '-'}
                                                </strong>
                                            </span>
                                            <span>
                                                Departure:{' '}
                                                <strong className="font-semibold text-foreground">
                                                    {request.booking
                                                        ?.departure_date
                                                        ? dayjs(
                                                              request.booking
                                                                  .departure_date,
                                                          ).format(
                                                              'DD MMM YYYY',
                                                          )
                                                        : '-'}
                                                </strong>
                                            </span>
                                            <span>
                                                Grand total:{' '}
                                                <strong className="font-semibold text-foreground">
                                                    {formatIDR(
                                                        request.booking
                                                            ?.grand_total ?? 0,
                                                    )}
                                                </strong>
                                            </span>
                                        </div>
                                        {request.reason && (
                                            <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                                                {request.reason}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="gap-2"
                                            disabled={
                                                processingId === request.id
                                            }
                                            onClick={() =>
                                                submitDecision(
                                                    request.id,
                                                    'reject',
                                                )
                                            }
                                        >
                                            <XIcon className="size-4" />
                                            Reject
                                        </Button>
                                        <Button
                                            type="button"
                                            className="gap-2"
                                            disabled={
                                                processingId === request.id
                                            }
                                            onClick={() =>
                                                submitDecision(
                                                    request.id,
                                                    'approve',
                                                )
                                            }
                                        >
                                            <CheckIcon className="size-4" />
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
