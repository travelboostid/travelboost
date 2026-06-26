import BookingSchedulePicker, {
    type RescheduleScheduleOption,
} from '@/components/booking/booking-schedule-picker';
import {
    ManualPaymentDialog,
    type ManualPaymentData,
} from '@/components/booking/ManualPaymentDialog';
import { PaymentMethodDialog } from '@/components/payment/payment-method-dialog';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { formatIDR } from '@/constants/booking';
import { openOnlinePayment } from '@/lib/open-online-payment';
import { hasOnlinePaymentInstructions } from '@/lib/payment-instructions';
import { cn } from '@/lib/utils';
import { CorrectionChangeSummary } from '@/pages/companies/dashboard/bookings/components/booking-correction/correction-change-summary';
import ReschedulePriceAdjustmentField from '@/pages/companies/dashboard/bookings/components/booking-correction/reschedule-price-adjustment-field';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import dayjs from 'dayjs';
import {
    ArrowRightIcon,
    CircleSlashIcon,
    Clock3Icon,
    CreditCardIcon,
    EditIcon,
    EyeIcon,
    FileTextIcon,
    HistoryIcon,
    MoreHorizontal,
    RotateCcwIcon,
    Undo2Icon,
} from 'lucide-react';
import * as React from 'react';
import { FormattedMessage, useIntl, type IntlShape } from 'react-intl';
import type {
    BookingResource,
    PaymentDetail,
    PaymentReviewItem,
} from '../booking-index-types';
import { BookingIndexReceiptDialog } from './booking-index-receipt-dialog';

function reviewPaymentAmount(payment: PaymentReviewItem): number {
    return Number(payment.transfer_amount ?? payment.amount ?? 0);
}

function reviewPaymentType(payment: PaymentReviewItem): string {
    return (payment.payment_type ?? 'full_payment').replace(/_/g, ' ');
}

function reviewPaymentDetail(
    payment: PaymentReviewItem,
    intl: IntlShape,
): PaymentDetail {
    const receiptType = payment.provider === 'midtrans' ? 'online' : 'manual';

    return {
        method_label:
            payment.provider === 'midtrans'
                ? intl.formatMessage({ defaultMessage: 'Online payment' })
                : intl.formatMessage({ defaultMessage: 'Manual payment' }),
        receiver_label:
            payment.payment_flow_stage === 'agent_to_vendor'
                ? intl.formatMessage({ defaultMessage: 'vendor' })
                : intl.formatMessage({ defaultMessage: 'agent' }),
        amount: reviewPaymentAmount(payment),
        payment_date: payment.payment_date,
        booking_payment_type: payment.payment_type as
            | 'down_payment'
            | 'full_payment'
            | null
            | undefined,
        receipt:
            payment.receipt ??
            (payment.proof_url || payment.proof_path
                ? {
                      type: receiptType,
                      url: payment.proof_url,
                      provider: payment.provider,
                      method: payment.payment_method,
                      status: payment.status,
                  }
                : null),
    };
}

function PaymentReviewSection({
    title,
    payment,
    onViewReceipt,
}: {
    title: string;
    payment: PaymentReviewItem;
    onViewReceipt?: (detail: PaymentDetail) => void;
}) {
    const intl = useIntl();
    const amount = reviewPaymentAmount(payment);
    const detail = reviewPaymentDetail(payment, intl);
    const isOnlinePayment = payment.provider === 'midtrans';
    const senderLabel = isOnlinePayment
        ? intl.formatMessage({ defaultMessage: 'Payment Channel' })
        : intl.formatMessage({ defaultMessage: 'Sender Bank' });
    const senderValue = isOnlinePayment
        ? intl.formatMessage({ defaultMessage: 'Midtrans Online Payment' })
        : (payment.sender_bank_name ?? '—');
    const accountLabel = isOnlinePayment
        ? intl.formatMessage({ defaultMessage: 'Reference' })
        : intl.formatMessage({ defaultMessage: 'Account Number' });
    const accountValue = isOnlinePayment
        ? (detail.receipt?.order_id ??
          intl.formatMessage({ defaultMessage: 'Gateway transaction' }))
        : (payment.sender_account_number ?? '—');

    return (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="flex items-center justify-between gap-4 border-b pb-2">
                <span className="font-semibold">{title}</span>
                <Badge variant="outline" className="uppercase">
                    {payment.provider === 'midtrans'
                        ? intl.formatMessage({
                              defaultMessage: 'Online payment',
                          })
                        : intl.formatMessage({
                              defaultMessage: 'Manual payment',
                          })}
                </Badge>
            </div>
            <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{senderLabel}</span>
                <span className="text-right font-semibold">{senderValue}</span>
            </div>
            <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{accountLabel}</span>
                <span
                    className={cn(
                        'text-right font-semibold',
                        !isOnlinePayment && 'font-mono',
                    )}
                >
                    {accountValue}
                </span>
            </div>
            <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                    <FormattedMessage defaultMessage="Transfer Amount" />
                </span>
                <span className="text-right font-semibold">
                    {formatIDR(amount)}
                </span>
            </div>
            <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                    <FormattedMessage defaultMessage="Payment Type" />
                </span>
                <span className="text-right font-semibold capitalize">
                    {reviewPaymentType(payment).toLowerCase()}
                </span>
            </div>
            <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                    <FormattedMessage defaultMessage="Payment Time" />
                </span>
                <span className="text-right font-semibold">
                    {payment.payment_date
                        ? dayjs(payment.payment_date).format('DD MMM YYYY')
                        : '—'}
                </span>
            </div>
            <div className="flex justify-between gap-4 border-t pt-3">
                <span className="text-muted-foreground">
                    <FormattedMessage defaultMessage="Receipt" />
                </span>
                {payment.proof_url ? (
                    <a
                        href={payment.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-primary hover:underline"
                    >
                        <FormattedMessage defaultMessage="View receipt" />
                    </a>
                ) : detail.receipt && onViewReceipt ? (
                    <button
                        type="button"
                        className="font-semibold text-primary underline-offset-2 hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                        onClick={() => onViewReceipt(detail)}
                    >
                        <FormattedMessage defaultMessage="View receipt" />
                    </button>
                ) : (
                    <span className="text-right text-muted-foreground">
                        {payment.proof_path ??
                            intl.formatMessage({
                                defaultMessage: 'Gateway receipt',
                            })}
                    </span>
                )}
            </div>
        </div>
    );
}

export function BookingIndexRowActions({
    booking,
    companyUsername,
    isAgent,
}: {
    booking: BookingResource;
    companyUsername: string;
    isAgent: boolean;
}) {
    const intl = useIntl();
    const [reviewOpen, setReviewOpen] = React.useState(false);
    const [reviewReceiptPayment, setReviewReceiptPayment] =
        React.useState<PaymentDetail | null>(null);
    const [manualPayVendorOpen, setManualPayVendorOpen] = React.useState(false);
    const [paymentActionError, setPaymentActionError] = React.useState<
        string | null
    >(null);
    const [vendorMethodDialogOpen, setVendorMethodDialogOpen] =
        React.useState(false);
    const [actionDialog, setActionDialog] = React.useState<
        'cancel' | 'refund' | 'reschedule' | 'restore' | null
    >(null);
    const [correctionAction, setCorrectionAction] = React.useState<
        'cancel' | 'refund' | 'reschedule' | 'restore'
    >('cancel');
    const [selectedSchedule, setSelectedSchedule] =
        React.useState<RescheduleScheduleOption | null>(null);
    const [actionReason, setActionReason] = React.useState('');
    const [applyCustomerPriceAdjustment, setApplyCustomerPriceAdjustment] =
        React.useState(true);
    const [processingAction, setProcessingAction] = React.useState<
        | 'accept'
        | 'cancel'
        | 'refund'
        | 'reschedule'
        | 'restore'
        | 'reorder'
        | 'pay_vendor_manual'
        | 'pay_vendor_online'
        | null
    >(null);
    const workflow = booking.payment_workflow;
    const workflowCustomerPayment = workflow?.customer_payment ?? null;
    const workflowAgentVendorPayment = workflow?.agent_vendor_payment ?? null;
    const manualPayment = booking.manual_payment;
    const customerPayment =
        manualPayment?.customer_payment ??
        workflowCustomerPayment ??
        (manualPayment?.payment_flow_stage === 'customer_to_agent'
            ? manualPayment
            : null);
    const agentVendorPayment =
        manualPayment?.agent_vendor_payment ?? workflowAgentVendorPayment;
    const canPayVendor = Boolean(workflow?.can_pay_vendor && customerPayment);
    const canReviewPayment =
        booking.status === 'waiting payment approval' &&
        Boolean(booking.manual_payment) &&
        Boolean(
            booking.can_review_payment ?? booking.can_review_manual_payment,
        );
    const canOpenPaymentReview = canReviewPayment || canPayVendor;
    const isAgentCollectionWorkflow = workflow?.mode === 'agent_collection';
    const canReviewCustomerPayment = Boolean(
        isAgentCollectionWorkflow &&
        workflow?.can_review_customer_payment &&
        booking.manual_payment?.payment_flow_stage === 'customer_to_agent',
    );
    const canReviewAgentVendorPayment = Boolean(
        isAgentCollectionWorkflow &&
        workflow?.can_review_agent_vendor_payment &&
        booking.manual_payment?.payment_flow_stage === 'agent_to_vendor',
    );
    const canReviewDirectPayment = Boolean(
        !isAgentCollectionWorkflow &&
        canReviewPayment &&
        booking.manual_payment,
    );
    const canSubmitPaymentReviewDecision =
        canReviewCustomerPayment ||
        canReviewAgentVendorPayment ||
        canReviewDirectPayment;
    const hasPendingActionRequest = Boolean(booking.pending_action_request);
    const canCancel = Boolean(booking.can_cancel) && !hasPendingActionRequest;
    const canRefund = Boolean(booking.can_refund) && !hasPendingActionRequest;
    const canReschedule =
        Boolean(booking.can_reschedule) && !hasPendingActionRequest;
    const canReactivate =
        Boolean(booking.can_reactivate) && !hasPendingActionRequest;
    const canReorder = Boolean(booking.can_reorder);
    const canOpenCorrection =
        canCancel || canRefund || canReschedule || canReactivate;
    const activeCorrectionAction = isAgent ? correctionAction : actionDialog;
    const invoiceOptions = booking.invoice_options ?? [];
    const manualPaymentId = booking.manual_payment?.id;
    const isPayVendorFollowup =
        booking.payment_followup?.action_label === 'Pay Vendor';
    const editStep =
        booking.payment_followup?.action_url && !isPayVendorFollowup
            ? 'payment'
            : booking.document_followup?.action_url
              ? 'documents'
              : null;
    const editHref = `/companies/${companyUsername}/dashboard/bookings/${booking.id}/edit${
        editStep ? `?step=${editStep}` : ''
    }`;
    const editLabel = intl.formatMessage({ defaultMessage: 'Edit' });

    React.useEffect(() => {
        if (!canOpenPaymentReview || !manualPaymentId) {
            return;
        }

        const reviewPaymentId = new URLSearchParams(window.location.search).get(
            'review_payment',
        );

        if (reviewPaymentId === String(manualPaymentId)) {
            setReviewOpen(true);
        }
    }, [canOpenPaymentReview, manualPaymentId]);

    const handleReviewOpenChange = React.useCallback((open: boolean) => {
        setReviewOpen(open);
    }, []);

    const submitManualPaymentDecision = () => {
        if (!booking.manual_payment || !canSubmitPaymentReviewDecision) return;

        setProcessingAction('accept');
        router.post(
            `/companies/${companyUsername}/dashboard/bookings/${booking.id}/payments/${booking.manual_payment.id}/approve`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setReviewOpen(false),
                onFinish: () => setProcessingAction(null),
            },
        );
    };
    const submitBookingAction = () => {
        const action = isAgent ? correctionAction : actionDialog;

        if (!action) {
            return;
        }

        if (action === 'reschedule' && !selectedSchedule) {
            return;
        }

        setProcessingAction(action);
        router.post(
            `/companies/${companyUsername}/dashboard/bookings/${booking.id}/${action}`,
            {
                reason: actionReason,
                ...(action === 'reschedule' && selectedSchedule
                    ? {
                          schedule_id: selectedSchedule.id,
                          ...(!isAgent
                              ? {
                                    apply_customer_price_adjustment:
                                        applyCustomerPriceAdjustment,
                                }
                              : {}),
                      }
                    : {}),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setActionDialog(null);
                    setActionReason('');
                    setSelectedSchedule(null);
                    setApplyCustomerPriceAdjustment(true);
                },
                onFinish: () => setProcessingAction(null),
            },
        );
    };
    const openCorrectionDialog = (
        action: 'cancel' | 'refund' | 'reschedule' | 'restore',
    ) => {
        setCorrectionAction(action);
        setActionDialog(action);
        setSelectedSchedule(null);
        setActionReason('');
        setApplyCustomerPriceAdjustment(true);
    };
    const submitReorder = () => {
        setProcessingAction('reorder');
        router.post(
            `/companies/${companyUsername}/dashboard/bookings/${booking.id}/reorder`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingAction(null),
            },
        );
    };
    const customerPaymentAmount = customerPayment
        ? reviewPaymentAmount(customerPayment)
        : 0;
    const customerPaymentType =
        (customerPayment?.payment_type as 'down_payment' | 'full_payment') ??
        'full_payment';
    const submitAgentVendorManualPayment = (data: ManualPaymentData) => {
        if (!customerPayment || !data.proofFile) return;

        setProcessingAction('pay_vendor_manual');
        setPaymentActionError(null);

        const formData = new FormData();
        formData.append('sender_bank_name', data.senderBankName);
        formData.append('sender_account_number', data.senderAccountNumber);
        formData.append('transfer_amount', String(customerPaymentAmount));
        formData.append('payment_type', customerPaymentType);
        formData.append('payment_date', data.paymentDate);
        formData.append('proof', data.proofFile);

        router.post(
            `/companies/${companyUsername}/dashboard/bookings/${booking.id}/manual-payment`,
            formData,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setManualPayVendorOpen(false);
                    setReviewOpen(false);
                },
                onError: (errors) => {
                    setPaymentActionError(
                        String(
                            errors.payment ??
                                errors.payment_type ??
                                errors.transfer_amount ??
                                intl.formatMessage({
                                    defaultMessage:
                                        'Payment could not be submitted.',
                                }),
                        ),
                    );
                },
                onFinish: () => setProcessingAction(null),
            },
        );
    };
    const confirmAgentVendorOnlinePayment = (
        paymentId: number | string | undefined,
    ) => {
        if (!paymentId) {
            setProcessingAction(null);
            return;
        }

        axios
            .post(
                `/companies/${companyUsername}/dashboard/bookings/${booking.id}/online-payment/${paymentId}/confirm`,
                {},
                {
                    withCredentials: true,
                    withXSRFToken: true,
                },
            )
            .then((response) => {
                const status = response.data?.payment?.status;

                if (status === 'paid') {
                    setReviewOpen(false);
                    router.reload();
                    return;
                }

                setPaymentActionError(
                    intl.formatMessage({
                        defaultMessage:
                            'Payment is not completed yet. You can reopen Online Payment to continue the same attempt while it is active.',
                    }),
                );
            })
            .catch(() => {
                setPaymentActionError(
                    intl.formatMessage({
                        defaultMessage:
                            'Payment status could not be confirmed yet. You can reopen Pay Vendor and continue the same payment attempt.',
                    }),
                );
            })
            .finally(() => setProcessingAction(null));
    };
    const submitAgentVendorOnlinePayment = (paymentMethodId: number) => {
        if (!customerPayment || customerPaymentAmount <= 0) return;

        setProcessingAction('pay_vendor_online');
        setPaymentActionError(null);

        axios
            .post(
                `/companies/${companyUsername}/dashboard/bookings/${booking.id}/online-payment`,
                {
                    payment_type: customerPaymentType,
                    amount: customerPaymentAmount,
                    payment_method_id: paymentMethodId,
                },
                {
                    withCredentials: true,
                    withXSRFToken: true,
                },
            )
            .then((response) => {
                const payment = response.data?.payment as
                    | {
                          id?: number | string;
                          provider?: string | null;
                          amount?: number | string | null;
                          status?: string | null;
                          payload?: Record<string, unknown>;
                      }
                    | undefined;
                const paymentId = response.data?.payment?.id as
                    | number
                    | string
                    | undefined;
                const payload = response.data?.payment?.payload as
                    | Record<string, unknown>
                    | undefined;
                const provider = payment?.provider ?? 'midtrans';
                const paymentAmount = Number(
                    payment?.amount ?? customerPaymentAmount,
                );

                if (
                    !payload ||
                    (!hasOnlinePaymentInstructions(provider, payload) &&
                        Object.keys(payload).length === 0)
                ) {
                    setPaymentActionError(
                        intl.formatMessage({
                            defaultMessage:
                                'Online payment could not be started. Please try again.',
                        }),
                    );
                    setProcessingAction(null);
                    return;
                }

                openOnlinePayment(
                    {
                        id: paymentId,
                        status: payment?.status ?? 'pending',
                        provider,
                        amount: Number.isFinite(paymentAmount)
                            ? paymentAmount
                            : customerPaymentAmount,
                        payload,
                    },
                    {
                        onPaid: () =>
                            confirmAgentVendorOnlinePayment(paymentId),
                        onComplete: () => setProcessingAction(null),
                        reloadOnPaid: false,
                        statusCheck: paymentId
                            ? {
                                  url: `/companies/${companyUsername}/dashboard/bookings/${booking.id}/online-payment/${paymentId}/confirm`,
                                  method: 'POST',
                              }
                            : undefined,
                    },
                );
            })
            .catch((error) => {
                const message =
                    error?.response?.data?.message ??
                    error?.response?.data?.errors?.payment?.[0] ??
                    intl.formatMessage({
                        defaultMessage: 'Online payment could not be started.',
                    });

                setPaymentActionError(String(message));
                setProcessingAction(null);
            });
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 text-secondary-foreground hover:bg-secondary/80 shadow-sm"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">
                            <FormattedMessage defaultMessage="Open menu" />
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {canReviewPayment && (
                        <>
                            <DropdownMenuItem
                                onSelect={(event) => {
                                    event.preventDefault();
                                    setReviewOpen(true);
                                }}
                            >
                                <FileTextIcon className="mr-2 h-4 w-4" />
                                <FormattedMessage defaultMessage="Payment Approval" />
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}
                    {canPayVendor && (
                        <>
                            <DropdownMenuItem
                                onSelect={(event) => {
                                    event.preventDefault();
                                    setReviewOpen(true);
                                }}
                            >
                                <CreditCardIcon className="mr-2 h-4 w-4" />
                                <FormattedMessage defaultMessage="Pay Vendor" />
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}
                    <DropdownMenuItem asChild>
                        <Link
                            href={`/companies/${companyUsername}/dashboard/bookings/${booking.id}`}
                        >
                            <EyeIcon className="mr-2 h-4 w-4" />
                            <FormattedMessage defaultMessage="View Detail" />
                        </Link>
                    </DropdownMenuItem>
                    {booking.continue_booking_url && (
                        <DropdownMenuItem asChild>
                            <Link href={booking.continue_booking_url}>
                                <ArrowRightIcon className="mr-2 h-4 w-4" />
                                <FormattedMessage defaultMessage="Continue Booking" />
                            </Link>
                        </DropdownMenuItem>
                    )}
                    {invoiceOptions.map((option) => (
                        <DropdownMenuItem key={option.type} asChild>
                            <a
                                href={`/companies/${companyUsername}/dashboard/bookings/${booking.id}/invoice?type=${option.type}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <FileTextIcon className="mr-2 h-4 w-4" />
                                {option.label}
                            </a>
                        </DropdownMenuItem>
                    ))}
                    {canReorder && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                disabled={processingAction !== null}
                                onSelect={(event) => {
                                    event.preventDefault();
                                    submitReorder();
                                }}
                            >
                                <RotateCcwIcon className="mr-2 h-4 w-4" />
                                {processingAction === 'reorder'
                                    ? intl.formatMessage({
                                          defaultMessage: 'Reordering...',
                                      })
                                    : intl.formatMessage({
                                          defaultMessage: 'Reorder',
                                      })}
                            </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href={editHref}>
                            <EditIcon className="mr-2 h-4 w-4" />
                            {editLabel}
                        </Link>
                    </DropdownMenuItem>
                    {isAgent &&
                        (canOpenCorrection || hasPendingActionRequest) && (
                            <>
                                <DropdownMenuSeparator />
                                {canOpenCorrection && (
                                    <DropdownMenuItem
                                        disabled={hasPendingActionRequest}
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            const defaultAction = canReschedule
                                                ? 'reschedule'
                                                : canReactivate
                                                  ? 'restore'
                                                  : canCancel && canRefund
                                                    ? 'cancel'
                                                    : canRefund
                                                      ? 'refund'
                                                      : canCancel
                                                        ? 'cancel'
                                                        : 'reschedule';
                                            openCorrectionDialog(defaultAction);
                                        }}
                                    >
                                        <CircleSlashIcon className="mr-2 h-4 w-4" />
                                        <FormattedMessage defaultMessage="Correction" />
                                    </DropdownMenuItem>
                                )}
                                {hasPendingActionRequest && (
                                    <DropdownMenuItem disabled>
                                        <FormattedMessage
                                            defaultMessage="Pending {action} request"
                                            values={{
                                                action:
                                                    booking
                                                        .pending_action_request
                                                        ?.target_action ??
                                                    intl.formatMessage({
                                                        defaultMessage:
                                                            'action',
                                                    }),
                                            }}
                                        />
                                    </DropdownMenuItem>
                                )}
                            </>
                        )}
                    {!isAgent &&
                        (canCancel ||
                            canRefund ||
                            canReschedule ||
                            canReactivate) && (
                            <>
                                <DropdownMenuSeparator />
                                {canReschedule && (
                                    <DropdownMenuItem
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            openCorrectionDialog('reschedule');
                                        }}
                                    >
                                        <Clock3Icon className="mr-2 h-4 w-4" />
                                        <FormattedMessage defaultMessage="Reschedule" />
                                    </DropdownMenuItem>
                                )}
                                {canReactivate && (
                                    <DropdownMenuItem
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            openCorrectionDialog('restore');
                                        }}
                                    >
                                        <HistoryIcon className="mr-2 h-4 w-4" />
                                        <FormattedMessage defaultMessage="Reactivate" />
                                    </DropdownMenuItem>
                                )}
                                {canCancel && (
                                    <DropdownMenuItem
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            openCorrectionDialog('cancel');
                                        }}
                                    >
                                        <CircleSlashIcon className="mr-2 h-4 w-4" />
                                        <FormattedMessage defaultMessage="Cancel" />
                                    </DropdownMenuItem>
                                )}
                                {canRefund && (
                                    <DropdownMenuItem
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            openCorrectionDialog('refund');
                                        }}
                                    >
                                        <Undo2Icon className="mr-2 h-4 w-4" />
                                        <FormattedMessage defaultMessage="Refund" />
                                    </DropdownMenuItem>
                                )}
                            </>
                        )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={reviewOpen} onOpenChange={handleReviewOpenChange}>
                <DialogContent className="w-full max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {canPayVendor && !canSubmitPaymentReviewDecision
                                ? intl.formatMessage({
                                      defaultMessage: 'Pay Vendor',
                                  })
                                : intl.formatMessage({
                                      defaultMessage: 'Payment Approval',
                                  })}
                        </DialogTitle>
                        <DialogDescription>
                            {canPayVendor && !canSubmitPaymentReviewDecision
                                ? intl.formatMessage({
                                      defaultMessage:
                                          'Review the customer receipt, then submit the agent-to-vendor settlement.',
                                  })
                                : intl.formatMessage({
                                      defaultMessage:
                                          'Verify the payment receipt before approving this booking payment.',
                                  })}
                        </DialogDescription>
                    </DialogHeader>

                    {workflow?.mode === 'agent_collection' && (
                        <div className="space-y-4">
                            {customerPayment && (
                                <PaymentReviewSection
                                    title={intl.formatMessage({
                                        defaultMessage: 'Customer to Agent',
                                    })}
                                    payment={customerPayment}
                                    onViewReceipt={setReviewReceiptPayment}
                                />
                            )}

                            {agentVendorPayment ? (
                                <PaymentReviewSection
                                    title={intl.formatMessage({
                                        defaultMessage: 'Agent to Vendor',
                                    })}
                                    payment={agentVendorPayment}
                                    onViewReceipt={setReviewReceiptPayment}
                                />
                            ) : canPayVendor ? (
                                <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-semibold">
                                                <FormattedMessage defaultMessage="Agent to Vendor" />
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                <FormattedMessage defaultMessage="Submit the vendor settlement for this verified customer payment." />
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="uppercase"
                                        >
                                            {customerPayment
                                                ? reviewPaymentType(
                                                      customerPayment,
                                                  )
                                                : intl.formatMessage({
                                                      defaultMessage: 'Payment',
                                                  })}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between gap-4 border-t pt-3">
                                        <span className="text-muted-foreground">
                                            <FormattedMessage defaultMessage="Amount" />
                                        </span>
                                        <span className="font-semibold">
                                            {formatIDR(customerPaymentAmount)}
                                        </span>
                                    </div>
                                    {paymentActionError && (
                                        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                                            {paymentActionError}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap justify-end gap-2 pt-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={processingAction !== null}
                                            onClick={() =>
                                                setManualPayVendorOpen(true)
                                            }
                                        >
                                            <FormattedMessage defaultMessage="Manual Transfer" />
                                        </Button>
                                        <Button
                                            type="button"
                                            disabled={processingAction !== null}
                                            onClick={() =>
                                                setVendorMethodDialogOpen(true)
                                            }
                                        >
                                            {processingAction ===
                                            'pay_vendor_online'
                                                ? intl.formatMessage({
                                                      defaultMessage:
                                                          'Opening...',
                                                  })
                                                : intl.formatMessage({
                                                      defaultMessage:
                                                          'Online Payment',
                                                  })}
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {workflow?.mode !== 'agent_collection' &&
                        booking.manual_payment &&
                        !booking.manual_payment.agent_vendor_payment && (
                            <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">
                                        <FormattedMessage defaultMessage="Sender Bank" />
                                    </span>
                                    <span className="text-right font-semibold">
                                        {booking.manual_payment
                                            .sender_bank_name ?? '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">
                                        <FormattedMessage defaultMessage="Account Number" />
                                    </span>
                                    <span className="text-right font-mono font-semibold">
                                        {booking.manual_payment
                                            .sender_account_number ?? '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">
                                        <FormattedMessage defaultMessage="Transfer Amount" />
                                    </span>
                                    <span className="text-right font-semibold">
                                        {formatIDR(
                                            booking.manual_payment
                                                .transfer_amount,
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">
                                        <FormattedMessage defaultMessage="Payment Type" />
                                    </span>
                                    <span className="text-right font-semibold capitalize">
                                        {(
                                            booking.manual_payment
                                                .payment_type ?? 'full_payment'
                                        )
                                            .replace(/_/g, ' ')
                                            .toLowerCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">
                                        <FormattedMessage defaultMessage="Payment Time" />
                                    </span>
                                    <span className="text-right font-semibold">
                                        {booking.manual_payment.payment_date
                                            ? dayjs(
                                                  booking.manual_payment
                                                      .payment_date,
                                              ).format('DD MMM YYYY')
                                            : '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4 border-t pt-3">
                                    <span className="text-muted-foreground">
                                        <FormattedMessage defaultMessage="Receipt" />
                                    </span>
                                    {booking.manual_payment.proof_url ? (
                                        <a
                                            href={
                                                booking.manual_payment.proof_url
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-semibold text-primary hover:underline"
                                        >
                                            <FormattedMessage defaultMessage="View receipt" />
                                        </a>
                                    ) : (
                                        <span className="text-right text-muted-foreground">
                                            {booking.manual_payment
                                                .proof_path ?? '—'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                    {workflow?.mode !== 'agent_collection' &&
                        booking.manual_payment?.customer_payment &&
                        booking.manual_payment.agent_vendor_payment && (
                            <div className="space-y-4">
                                <PaymentReviewSection
                                    title={intl.formatMessage({
                                        defaultMessage: 'Customer to Agent',
                                    })}
                                    payment={
                                        booking.manual_payment.customer_payment
                                    }
                                />
                                <PaymentReviewSection
                                    title={intl.formatMessage({
                                        defaultMessage: 'Agent to Vendor',
                                    })}
                                    payment={
                                        booking.manual_payment
                                            .agent_vendor_payment
                                    }
                                />
                            </div>
                        )}

                    {canSubmitPaymentReviewDecision && (
                        <DialogFooter>
                            <Button
                                type="button"
                                disabled={processingAction !== null}
                                onClick={submitManualPaymentDecision}
                            >
                                {processingAction === 'accept'
                                    ? intl.formatMessage({
                                          defaultMessage: 'Approving...',
                                      })
                                    : intl.formatMessage({
                                          defaultMessage: 'Approve',
                                      })}
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>

            <PaymentMethodDialog
                open={vendorMethodDialogOpen}
                onOpenChange={setVendorMethodDialogOpen}
                description={intl.formatMessage(
                    {
                        defaultMessage:
                            'Select how you want to pay {amount} to the vendor',
                    },
                    { amount: formatIDR(customerPaymentAmount) },
                )}
                loading={processingAction === 'pay_vendor_online'}
                onConfirm={(methodId) => {
                    setVendorMethodDialogOpen(false);
                    submitAgentVendorOnlinePayment(methodId);
                }}
            />

            <ManualPaymentDialog
                open={manualPayVendorOpen}
                onClose={() => setManualPayVendorOpen(false)}
                onSubmit={submitAgentVendorManualPayment}
                isSubmitting={processingAction === 'pay_vendor_manual'}
                vendorBank={
                    workflow?.vendor_bank_info ?? {
                        bankName: '',
                        accountName: '',
                        accountNumber: '',
                    }
                }
                amount={customerPaymentAmount}
            />

            <BookingIndexReceiptDialog
                payment={reviewReceiptPayment}
                onOpenChange={(open) => {
                    if (!open) {
                        setReviewReceiptPayment(null);
                    }
                }}
            />

            <Dialog
                open={actionDialog !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setActionDialog(null);
                        setActionReason('');
                        setSelectedSchedule(null);
                    }
                }}
            >
                <DialogContent className="w-full max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="capitalize">
                            {isAgent
                                ? intl.formatMessage({
                                      defaultMessage: 'Booking Correction',
                                  })
                                : actionDialog === 'cancel'
                                  ? intl.formatMessage({
                                        defaultMessage: 'Cancel booking',
                                    })
                                  : actionDialog === 'refund'
                                    ? intl.formatMessage({
                                          defaultMessage: 'Refund booking',
                                      })
                                    : actionDialog === 'reschedule'
                                      ? intl.formatMessage({
                                            defaultMessage:
                                                'Reschedule booking',
                                        })
                                      : intl.formatMessage({
                                            defaultMessage:
                                                'Reactivate booking',
                                        })}
                        </DialogTitle>
                        <DialogDescription>
                            {isAgent
                                ? intl.formatMessage({
                                      defaultMessage:
                                          'Choose the correction type and add a reason. The vendor will review your request.',
                                  })
                                : actionDialog === 'cancel'
                                  ? intl.formatMessage({
                                        defaultMessage:
                                            'Are you sure you want to cancel this booking?',
                                    })
                                  : actionDialog === 'refund'
                                    ? intl.formatMessage({
                                          defaultMessage:
                                              'Are you sure you want to refund this booking?',
                                      })
                                    : actionDialog === 'reschedule'
                                      ? intl.formatMessage({
                                            defaultMessage:
                                                'Choose a new departure date for this booking.',
                                        })
                                      : intl.formatMessage({
                                            defaultMessage:
                                                'Restore this cancelled booking to an active status.',
                                        })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                        {isAgent && (
                            <RadioGroup
                                value={correctionAction}
                                onValueChange={(value) => {
                                    const nextAction = value as
                                        | 'cancel'
                                        | 'refund'
                                        | 'reschedule'
                                        | 'restore';
                                    setCorrectionAction(nextAction);
                                    setActionDialog(nextAction);
                                    setSelectedSchedule(null);
                                }}
                                className="grid grid-cols-2 gap-2"
                            >
                                <Label
                                    htmlFor="correction-cancel"
                                    className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[[data-state=disabled]]:cursor-not-allowed has-[[data-state=disabled]]:opacity-50"
                                >
                                    <RadioGroupItem
                                        value="cancel"
                                        id="correction-cancel"
                                        disabled={!canCancel}
                                        className="h-3.5 w-3.5"
                                    />
                                    <FormattedMessage defaultMessage="Cancellation" />
                                </Label>
                                <Label
                                    htmlFor="correction-refund"
                                    className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[[data-state=disabled]]:cursor-not-allowed has-[[data-state=disabled]]:opacity-50"
                                >
                                    <RadioGroupItem
                                        value="refund"
                                        id="correction-refund"
                                        disabled={!canRefund}
                                        className="h-3.5 w-3.5"
                                    />
                                    <FormattedMessage defaultMessage="Refund" />
                                </Label>
                                <Label
                                    htmlFor="correction-reschedule"
                                    className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[[data-state=disabled]]:cursor-not-allowed has-[[data-state=disabled]]:opacity-50"
                                >
                                    <RadioGroupItem
                                        value="reschedule"
                                        id="correction-reschedule"
                                        disabled={!canReschedule}
                                        className="h-3.5 w-3.5"
                                    />
                                    <FormattedMessage defaultMessage="Reschedule" />
                                </Label>
                                <Label
                                    htmlFor="correction-restore"
                                    className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[[data-state=disabled]]:cursor-not-allowed has-[[data-state=disabled]]:opacity-50"
                                >
                                    <RadioGroupItem
                                        value="restore"
                                        id="correction-restore"
                                        disabled={!canReactivate}
                                        className="h-3.5 w-3.5"
                                    />
                                    <FormattedMessage defaultMessage="Reactivation" />
                                </Label>
                            </RadioGroup>
                        )}
                        {activeCorrectionAction === 'reschedule' && (
                            <BookingSchedulePicker
                                companyUsername={companyUsername}
                                bookingId={booking.id}
                                selectedScheduleId={
                                    selectedSchedule?.id ?? null
                                }
                                onSelect={setSelectedSchedule}
                            />
                        )}
                        {activeCorrectionAction === 'reschedule' &&
                            selectedSchedule && (
                                <div className="space-y-2">
                                    <CorrectionChangeSummary
                                        targetAction="reschedule"
                                        currentDeparture={
                                            booking.departure_date
                                        }
                                        payload={{
                                            previous_departure_date:
                                                booking.departure_date,
                                            requested_departure_date:
                                                selectedSchedule.departure_date,
                                            price_before: Number(
                                                booking.grand_total ?? 0,
                                            ),
                                            price_after:
                                                selectedSchedule.price_preview
                                                    .grand_total,
                                            price_difference:
                                                selectedSchedule.price_preview
                                                    .price_difference,
                                        }}
                                    />
                                    {isAgent ? (
                                        <>
                                            {selectedSchedule.price_preview
                                                .price_difference > 0 && (
                                                <p className="rounded-md border border-amber-200/70 bg-amber-50/80 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                                                    <FormattedMessage defaultMessage="The customer may need to pay an additional balance after reschedule. The vendor will confirm payment terms." />
                                                </p>
                                            )}
                                            {selectedSchedule.price_preview
                                                .price_difference < 0 && (
                                                <p className="rounded-md border border-emerald-200/70 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
                                                    <FormattedMessage defaultMessage="A credit balance may be available. Contact the vendor to arrange a refund for the price difference." />
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <ReschedulePriceAdjustmentField
                                            priceDifference={
                                                selectedSchedule.price_preview
                                                    .price_difference
                                            }
                                            value={applyCustomerPriceAdjustment}
                                            onChange={
                                                setApplyCustomerPriceAdjustment
                                            }
                                        />
                                    )}
                                </div>
                            )}
                        {activeCorrectionAction === 'restore' && (
                            <div className="rounded-lg border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
                                <FormattedMessage
                                    defaultMessage="This will reactivate the cancelled booking on {date} and restore its previous payment status."
                                    values={{
                                        date: booking.departure_date
                                            ? dayjs(
                                                  booking.departure_date,
                                              ).format('DD MMM YYYY')
                                            : '-',
                                    }}
                                />
                            </div>
                        )}
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="correction-reason"
                                className="text-xs"
                            >
                                <FormattedMessage defaultMessage="Reason" />
                            </Label>
                            <Textarea
                                id="correction-reason"
                                value={actionReason}
                                onChange={(event) =>
                                    setActionReason(event.target.value)
                                }
                                placeholder={intl.formatMessage({
                                    defaultMessage: 'Reason (optional)',
                                })}
                                rows={3}
                                className="text-sm"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            size="sm"
                            variant={
                                actionDialog === 'refund' ||
                                actionDialog === 'reschedule' ||
                                actionDialog === 'restore'
                                    ? 'default'
                                    : 'destructive'
                            }
                            disabled={
                                processingAction !== null ||
                                (isAgent &&
                                    correctionAction === 'cancel' &&
                                    !canCancel) ||
                                (isAgent &&
                                    correctionAction === 'refund' &&
                                    !canRefund) ||
                                (isAgent &&
                                    correctionAction === 'reschedule' &&
                                    !canReschedule) ||
                                (isAgent &&
                                    correctionAction === 'restore' &&
                                    !canReactivate) ||
                                (!isAgent &&
                                    actionDialog === 'cancel' &&
                                    !canCancel) ||
                                (!isAgent &&
                                    actionDialog === 'refund' &&
                                    !canRefund) ||
                                (!isAgent &&
                                    actionDialog === 'reschedule' &&
                                    (!canReschedule || !selectedSchedule)) ||
                                (!isAgent &&
                                    actionDialog === 'restore' &&
                                    !canReactivate) ||
                                ((isAgent ? correctionAction : actionDialog) ===
                                    'reschedule' &&
                                    !selectedSchedule)
                            }
                            onClick={submitBookingAction}
                            className="capitalize"
                        >
                            {processingAction !== null
                                ? intl.formatMessage({
                                      defaultMessage: 'Processing...',
                                  })
                                : isAgent
                                  ? correctionAction === 'cancel'
                                      ? intl.formatMessage({
                                            defaultMessage:
                                                'Request cancellation',
                                        })
                                      : correctionAction === 'refund'
                                        ? intl.formatMessage({
                                              defaultMessage: 'Request refund',
                                          })
                                        : correctionAction === 'reschedule'
                                          ? intl.formatMessage({
                                                defaultMessage:
                                                    'Request reschedule',
                                            })
                                          : intl.formatMessage({
                                                defaultMessage:
                                                    'Request reactivation',
                                            })
                                  : actionDialog === 'cancel'
                                    ? intl.formatMessage({
                                          defaultMessage: 'Yes, cancel booking',
                                      })
                                    : actionDialog === 'refund'
                                      ? intl.formatMessage({
                                            defaultMessage:
                                                'Yes, refund booking',
                                        })
                                      : actionDialog === 'reschedule'
                                        ? intl.formatMessage({
                                              defaultMessage:
                                                  'Confirm reschedule',
                                          })
                                        : intl.formatMessage({
                                              defaultMessage:
                                                  'Confirm reactivation',
                                          })}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
