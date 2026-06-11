import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import MoneyInput from '@/components/ui/money-input';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    BoldIcon,
    Heading2Icon,
    ItalicIcon,
    ListOrderedIcon,
    StrikethroughIcon,
    UnderlineIcon,
} from 'lucide-react';
import {
    useCallback,
    useEffect,
    useRef,
    type FormEvent,
    type MouseEvent,
    type RefObject,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

type Settings = {
    booking_deadline: number;
    minimum_down_payment: number;
    minimum_down_payment_value: number;
    minimum_vat: number;
    term_conditions: string;
    cancel_refund_term_conditions: string;
    booking_entry_time_limit: number;
    manual_bank_transfer: string;
    manual_bank_transfer_account_name: string;
    manual_bank_transfer_account_number: string;
    email_payment_gateway: string;
    password_payment_gateway: string;
    full_payment_deadline: number;
    document_completed_deadline: number;
};

type DecimalInputValue = string | number;

type ParameterVendorFormData = {
    booking_deadline: number;
    minimum_down_payment: DecimalInputValue;
    minimum_down_payment_value: number;
    minimum_vat: DecimalInputValue;
    term_conditions: string;
    cancel_refund_term_conditions: string;
    booking_entry_time_limit: number;
    manual_bank_transfer: string;
    manual_bank_transfer_account_name: string;
    manual_bank_transfer_account_number: string;
    email_payment_gateway: string;
    password_payment_gateway: string;
    full_payment_deadline: number | string;
    document_completed_deadline: number | string;
    _method: 'put';
};

const decimalInputValue = (value: unknown): string => {
    const numeric = Number(value ?? 0);

    return Number.isFinite(numeric) ? String(numeric) : '0';
};

const normalizeDecimalInput = (value: string): string => {
    const sanitized = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const firstDotIndex = sanitized.indexOf('.');

    if (firstDotIndex === -1) {
        return sanitized;
    }

    return (
        sanitized.slice(0, firstDotIndex + 1) +
        sanitized.slice(firstDotIndex + 1).replace(/\./g, '')
    );
};

const parseDecimalInput = (value: DecimalInputValue): number => {
    const parsed = parseFloat(String(value).replace(',', '.'));

    return Number.isFinite(parsed) ? parsed : 0;
};

type EditorCommand =
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strikeThrough'
    | 'insertOrderedList';

const termsEditorToolbar = [
    {
        icon: Heading2Icon,
        title: 'Heading',
        type: 'block',
        value: 'h2',
    },
    { icon: BoldIcon, title: 'Bold', type: 'command', value: 'bold' },
    { icon: ItalicIcon, title: 'Italic', type: 'command', value: 'italic' },
    {
        icon: UnderlineIcon,
        title: 'Underline',
        type: 'command',
        value: 'underline',
    },
    {
        icon: StrikethroughIcon,
        title: 'Strikethrough',
        type: 'command',
        value: 'strikeThrough',
    },
    {
        icon: ListOrderedIcon,
        title: 'Numbered List',
        type: 'command',
        value: 'insertOrderedList',
    },
] as const;

const richTextDisplayClass =
    '[&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_ol]:ml-6 [&_ol]:list-decimal [&_p]:mb-3 [&_strike]:text-muted-foreground';

const normalizeTermsForEditor = (value: string): string => {
    if (!value.trim()) {
        return '';
    }

    if (value.includes('<')) {
        return value;
    }

    return value.replace(/\n/g, '<br />');
};

function TermsEditorToolbar({
    onAction,
}: {
    onAction: (
        event: MouseEvent<HTMLButtonElement>,
        type: 'command' | 'block',
        value: string,
    ) => void;
}) {
    return (
        <TooltipProvider delayDuration={150}>
            <div className="flex flex-wrap gap-2 border-b border-border/70 bg-muted/20 px-3 py-3">
                {termsEditorToolbar.map((item) => {
                    const Icon = item.icon;

                    return (
                        <Tooltip key={`${item.type}-${item.value}`}>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onMouseDown={(event) =>
                                        onAction(event, item.type, item.value)
                                    }
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition hover:bg-muted"
                                    aria-label={item.title}
                                >
                                    <Icon className="size-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                {item.title}
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}

function TermsEditorPanel({
    editorId,
    editorRef,
    error,
    description,
    onInput,
    onToolbarAction,
}: {
    editorId: string;
    editorRef: RefObject<HTMLDivElement | null>;
    error?: string;
    description: string;
    onInput: () => void;
    onToolbarAction: (
        event: MouseEvent<HTMLButtonElement>,
        type: 'command' | 'block',
        value: string,
    ) => void;
}) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-background shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-border/70 px-4 py-3">
                <p className="text-sm leading-6 text-muted-foreground">
                    {description}
                </p>
            </div>
            <TermsEditorToolbar onAction={onToolbarAction} />
            <div
                id={editorId}
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={onInput}
                className={`min-h-[220px] w-full px-4 py-4 text-sm leading-7 text-foreground outline-none ${richTextDisplayClass}`}
            />
            {error && <p className="px-4 pb-4 text-sm text-red-500">{error}</p>}
            {!error && (
                <div className="px-4 pb-4 text-xs text-muted-foreground">
                    Preview is saved exactly as shown in the editor.
                </div>
            )}
        </div>
    );
}

export default function ParameterVendorPage() {
    const intl = useIntl();
    const bookingTermsEditorRef = useRef<HTMLDivElement | null>(null);
    const cancelRefundTermsEditorRef = useRef<HTMLDivElement | null>(null);

    const { props } = usePage<{
        settings: Settings;
        flash?: {
            success?: string;
        };
    }>();

    const form = useForm<ParameterVendorFormData>({
        booking_deadline: props.settings?.booking_deadline ?? 0,
        minimum_down_payment: decimalInputValue(
            props.settings?.minimum_down_payment ?? 0,
        ),
        minimum_down_payment_value:
            props.settings?.minimum_down_payment_value ?? 0,
        minimum_vat: decimalInputValue(props.settings?.minimum_vat ?? 0),
        term_conditions: props.settings?.term_conditions ?? '',
        cancel_refund_term_conditions:
            props.settings?.cancel_refund_term_conditions ?? '',
        booking_entry_time_limit: props.settings?.booking_entry_time_limit ?? 0,
        manual_bank_transfer: props.settings?.manual_bank_transfer ?? '',
        manual_bank_transfer_account_name:
            props.settings?.manual_bank_transfer_account_name ?? '',
        manual_bank_transfer_account_number:
            props.settings?.manual_bank_transfer_account_number ?? '',
        email_payment_gateway: props.settings?.email_payment_gateway ?? '',
        password_payment_gateway:
            props.settings?.password_payment_gateway ?? '',
        full_payment_deadline: props.settings?.full_payment_deadline ?? '',
        document_completed_deadline:
            props.settings?.document_completed_deadline ?? '',
        _method: 'put',
    });
    const { data, setData, post, processing, errors } = form;

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        form.transform((payload) => ({
            ...payload,
            minimum_down_payment: parseDecimalInput(
                payload.minimum_down_payment,
            ),
            minimum_down_payment_value: Number(
                payload.minimum_down_payment_value || 0,
            ),
            minimum_vat: parseDecimalInput(payload.minimum_vat),
        }));

        post(window.location.pathname);
    };

    const inputClass =
        'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary sm:px-4 sm:py-2.5';
    const labelClass =
        'mb-2 block min-h-[48px] text-sm font-medium text-foreground';
    const labelClassSingleRow =
        'mb-2 block text-sm font-medium text-foreground';

    const hasPercentage = parseDecimalInput(data.minimum_down_payment) > 0;

    const hasAmount = Number(data.minimum_down_payment_value || 0) > 0;

    useEffect(() => {
        if (
            bookingTermsEditorRef.current &&
            bookingTermsEditorRef.current.innerHTML !==
                normalizeTermsForEditor(data.term_conditions)
        ) {
            bookingTermsEditorRef.current.innerHTML = normalizeTermsForEditor(
                data.term_conditions,
            );
        }
    }, [data.term_conditions]);

    useEffect(() => {
        if (
            cancelRefundTermsEditorRef.current &&
            cancelRefundTermsEditorRef.current.innerHTML !==
                normalizeTermsForEditor(data.cancel_refund_term_conditions)
        ) {
            cancelRefundTermsEditorRef.current.innerHTML =
                normalizeTermsForEditor(data.cancel_refund_term_conditions);
        }
    }, [data.cancel_refund_term_conditions]);

    const syncTermsEditor = useCallback(
        (field: 'term_conditions' | 'cancel_refund_term_conditions') => {
            const editor =
                field === 'term_conditions'
                    ? bookingTermsEditorRef.current
                    : cancelRefundTermsEditorRef.current;

            setData(field, editor?.innerHTML ?? '');
        },
        [setData],
    );

    const applyTermsEditorCommand = useCallback(
        (
            event: MouseEvent<HTMLButtonElement>,
            field: 'term_conditions' | 'cancel_refund_term_conditions',
            type: 'command' | 'block',
            value: string,
        ) => {
            event.preventDefault();
            const editor =
                field === 'term_conditions'
                    ? bookingTermsEditorRef.current
                    : cancelRefundTermsEditorRef.current;

            editor?.focus();

            if (type === 'block') {
                document.execCommand('formatBlock', false, value);
            } else {
                document.execCommand(value as EditorCommand, false);
            }

            syncTermsEditor(field);
        },
        [syncTermsEditor],
    );

    return (
        <CompanyDashboardLayout
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Settings',
                    }),
                },
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Vendor Parameters',
                    }),
                },
            ]}
            openMenuIds={['settings']}
            activeMenuIds={['settings.parameter-vendor']}
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Vendor Parameters',
                })}
            />

            <div className="mx-auto w-full max-w-5xl space-y-4 px-3 pb-20 sm:space-y-6 sm:px-4">
                {/* Header */}

                <div className="overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.08] via-background to-background shadow-sm">
                    <div className="flex flex-col gap-6 px-5 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                                {/* <SparklesIcon className="size-3.5" /> */}
                                Vendor Configuration
                            </div>
                            <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                <FormattedMessage defaultMessage="Parameters Settings" />
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                                <FormattedMessage defaultMessage="Manage booking rules, payment settings, and policy content from one place with a cleaner editor workflow." />
                            </p>
                        </div>

                        {/* <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                            <div className="rounded-2xl border border-border/70 bg-background/90 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    Booking Rules
                                </p>
                                <p className="mt-2 text-sm font-semibold text-foreground">
                                    Deadlines and reserve time
                                </p>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-background/90 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    Payments
                                </p>
                                <p className="mt-2 text-sm font-semibold text-foreground">
                                    Down payment, VAT, and transfer info
                                </p>
                            </div>
                            <div className="rounded-2xl border border-border/70 bg-background/90 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    Policies
                                </p>
                                <p className="mt-2 text-sm font-semibold text-foreground">
                                    Booking and cancel/refund terms
                                </p>
                            </div>
                        </div> */}
                    </div>
                </div>

                {props.flash?.success && (
                    <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm">
                        {props.flash.success}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    {/* Booking Rules */}
                    <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
                        <h2 className="mb-5 text-lg font-semibold">
                            <FormattedMessage defaultMessage="Booking Entry Rules" />
                        </h2>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <div>
                                <label className={labelClass}>
                                    <FormattedMessage defaultMessage="Entry Deadline Before Departure Date (days)" />
                                </label>
                                <MoneyInput
                                    value={data.booking_deadline}
                                    className={inputClass}
                                    onChange={(raw) =>
                                        setData('booking_deadline', Number(raw))
                                    }
                                />
                                {errors.booking_deadline && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.booking_deadline}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className={labelClass}>
                                    <FormattedMessage defaultMessage="Booking Reserve Time Limit (minutes)" />
                                </label>
                                <MoneyInput
                                    value={data.booking_entry_time_limit}
                                    className={inputClass}
                                    onChange={(raw) =>
                                        setData(
                                            'booking_entry_time_limit',
                                            Number(raw),
                                        )
                                    }
                                />
                                {errors.booking_entry_time_limit && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.booking_entry_time_limit}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className={labelClass}>
                                    <FormattedMessage defaultMessage="Document Completed Deadline Before Departure Date (days)" />
                                </label>

                                <MoneyInput
                                    value={data.document_completed_deadline}
                                    className={inputClass}
                                    onChange={(raw) =>
                                        setData(
                                            'document_completed_deadline',
                                            Number(raw),
                                        )
                                    }
                                />

                                {errors.document_completed_deadline && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.document_completed_deadline}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Financial */}
                    <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
                        <h2 className="mb-5 text-lg font-semibold">
                            <FormattedMessage defaultMessage="Booking Payment Rules" />
                        </h2>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div>
                                <label className={labelClassSingleRow}>
                                    <FormattedMessage defaultMessage="Minimum Down Payment (%) / total base price" />
                                </label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className={inputClass}
                                    disabled={hasAmount}
                                    value={data.minimum_down_payment}
                                    onChange={(e) => {
                                        setData(
                                            'minimum_down_payment',
                                            normalizeDecimalInput(
                                                e.target.value,
                                            ),
                                        );
                                    }}
                                />
                                {errors.minimum_down_payment && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.minimum_down_payment}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className={labelClassSingleRow}>
                                    <FormattedMessage defaultMessage="Minimum Down Payment Amount / Pax" />
                                </label>
                                <MoneyInput
                                    value={data.minimum_down_payment_value}
                                    className={inputClass}
                                    disabled={hasPercentage}
                                    onChange={(raw) =>
                                        setData(
                                            'minimum_down_payment_value',
                                            Number(raw || 0),
                                        )
                                    }
                                />
                                {errors.minimum_down_payment_value && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.minimum_down_payment_value}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:col-span-2">
                                <div>
                                    <label className={labelClassSingleRow}>
                                        <FormattedMessage defaultMessage="VAT (%)" />
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className={inputClass}
                                        value={data.minimum_vat}
                                        onChange={(e) => {
                                            setData(
                                                'minimum_vat',
                                                normalizeDecimalInput(
                                                    e.target.value,
                                                ),
                                            );
                                        }}
                                    />
                                    {errors.minimum_vat && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.minimum_vat}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className={labelClassSingleRow}>
                                        <FormattedMessage defaultMessage="Full Payment Deadline Before Departure Date (days)" />
                                    </label>

                                    <MoneyInput
                                        value={data.full_payment_deadline}
                                        className={inputClass}
                                        onChange={(raw) =>
                                            setData(
                                                'full_payment_deadline',
                                                Number(raw),
                                            )
                                        }
                                    />

                                    {errors.full_payment_deadline && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.full_payment_deadline}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bank Transfer */}
                    <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
                        <h2 className="mb-5 text-lg font-semibold">
                            <FormattedMessage defaultMessage="Manual Bank Transfer" />
                        </h2>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div>
                                <label className={labelClassSingleRow}>
                                    <FormattedMessage defaultMessage="Bank Name" />
                                </label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={data.manual_bank_transfer}
                                    onChange={(e) =>
                                        setData(
                                            'manual_bank_transfer',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>

                            <div>
                                <label className={labelClassSingleRow}>
                                    <FormattedMessage defaultMessage="Account Name" />
                                </label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={
                                        data.manual_bank_transfer_account_name
                                    }
                                    onChange={(e) =>
                                        setData(
                                            'manual_bank_transfer_account_name',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClassSingleRow}>
                                    <FormattedMessage defaultMessage="Account Number" />
                                </label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={
                                        data.manual_bank_transfer_account_number
                                    }
                                    onChange={(e) =>
                                        setData(
                                            'manual_bank_transfer_account_number',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Gateway */}
                    <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
                        <h2 className="mb-5 text-lg font-semibold">
                            <FormattedMessage defaultMessage="Credential Payment Gateway" />
                        </h2>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div>
                                <label className={labelClassSingleRow}>
                                    <FormattedMessage defaultMessage="Payment Gateway Email" />
                                </label>

                                <input
                                    type="email"
                                    className={inputClass}
                                    value={data.email_payment_gateway}
                                    onChange={(e) =>
                                        setData(
                                            'email_payment_gateway',
                                            e.target.value,
                                        )
                                    }
                                />

                                {errors.email_payment_gateway && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.email_payment_gateway}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className={labelClassSingleRow}>
                                    <FormattedMessage defaultMessage="Payment Gateway Password" />
                                </label>

                                <input
                                    type="password"
                                    className={inputClass}
                                    value={data.password_payment_gateway}
                                    onChange={(e) =>
                                        setData(
                                            'password_payment_gateway',
                                            e.target.value,
                                        )
                                    }
                                />

                                {errors.password_payment_gateway && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.password_payment_gateway}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
                        <h2 className="mb-2 text-lg font-semibold">
                            <FormattedMessage defaultMessage="Booking Terms & Policies" />
                        </h2>
                        <p className="mb-5 text-sm leading-6 text-muted-foreground">
                            <FormattedMessage defaultMessage="Keep the page compact with accordions, and use the same formatting tools for both policy sections." />
                        </p>

                        <Accordion
                            type="multiple"
                            defaultValue={[
                                'booking-terms',
                                'cancel-refund-terms',
                            ]}
                            className="space-y-4"
                        >
                            <AccordionItem
                                value="booking-terms"
                                className="overflow-hidden rounded-2xl border border-border/80 bg-background"
                            >
                                <AccordionTrigger className="px-4 py-4 text-left hover:no-underline sm:px-5">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            Booking Terms & Conditions
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Rules shown during booking checkout.
                                        </p>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="border-t border-border/70 px-4 py-4 sm:px-5">
                                    <TermsEditorPanel
                                        editorId="term_conditions"
                                        editorRef={bookingTermsEditorRef}
                                        error={errors.term_conditions}
                                        description="Use headings, emphasis, and lists to make booking instructions easier to scan."
                                        onInput={() =>
                                            syncTermsEditor('term_conditions')
                                        }
                                        onToolbarAction={(event, type, value) =>
                                            applyTermsEditorCommand(
                                                event,
                                                'term_conditions',
                                                type,
                                                value,
                                            )
                                        }
                                    />
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem
                                value="cancel-refund-terms"
                                className="overflow-hidden rounded-2xl border border-border/80 bg-background"
                            >
                                <AccordionTrigger className="px-4 py-4 text-left hover:no-underline sm:px-5">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            Cancel & Refund Terms & Conditions
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Policy details for schedule changes,
                                            cancellation, and refunds.
                                        </p>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="border-t border-border/70 px-4 py-4 sm:px-5">
                                    <TermsEditorPanel
                                        editorId="cancel_refund_term_conditions"
                                        editorRef={cancelRefundTermsEditorRef}
                                        error={
                                            errors.cancel_refund_term_conditions
                                        }
                                        description="Use the same formatting tools to structure refund windows, penalties, and exceptions clearly."
                                        onInput={() =>
                                            syncTermsEditor(
                                                'cancel_refund_term_conditions',
                                            )
                                        }
                                        onToolbarAction={(event, type, value) =>
                                            applyTermsEditorCommand(
                                                event,
                                                'cancel_refund_term_conditions',
                                                type,
                                                value,
                                            )
                                        }
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    {/* Save */}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
                        >
                            {processing ? (
                                <FormattedMessage defaultMessage="Saving..." />
                            ) : (
                                <FormattedMessage defaultMessage="Save Changes" />
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </CompanyDashboardLayout>
    );
}
