import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import MoneyInput from '@/components/ui/money-input';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormattedMessage, useIntl } from 'react-intl';

type Settings = {
    booking_deadline: number;
    minimum_down_payment: number;
    minimum_down_payment_value: number;
    minimum_vat: number;
    term_conditions: string;
    booking_entry_time_limit: number;
    manual_bank_transfer: string;
    manual_bank_transfer_account_name: string;
    manual_bank_transfer_account_number: string;
    email_payment_gateway: string;
    password_payment_gateway: string;
    full_payment_deadline: number;
    document_completed_deadline: number;
};

export default function ParameterVendorPage() {
    const intl = useIntl();

    const { props } = usePage<{
        settings: Settings;
        flash?: {
            success?: string;
        };
    }>();

    const { data, setData, post, processing, errors } = useForm({
        booking_deadline: props.settings?.booking_deadline ?? 0,
        minimum_down_payment: props.settings?.minimum_down_payment ?? 0,
        minimum_down_payment_value:
            props.settings?.minimum_down_payment_value ?? 0,
        minimum_vat: props.settings?.minimum_vat ?? 0,
        term_conditions: props.settings?.term_conditions ?? '',
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

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post(window.location.pathname, {
            data: {
                ...data,
                minimum_down_payment:
                    parseFloat(
                        String(data.minimum_down_payment).replace(',', '.'),
                    ) || 0,

                minimum_down_payment_value:
                    parseFloat(
                        String(data.minimum_down_payment_value).replace(
                            ',',
                            '.',
                        ),
                    ) || 0,

                minimum_vat:
                    parseFloat(String(data.minimum_vat).replace(',', '.')) || 0,
            },
        });
    };

    const inputClass =
        'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary sm:px-4 sm:py-2.5';
    const labelClass =
        'mb-2 block min-h-[48px] text-sm font-medium text-foreground';
    const labelClassSingleRow =
        'mb-2 block text-sm font-medium text-foreground';

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

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                            <FormattedMessage defaultMessage="Parameters Settings" />
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                            <FormattedMessage defaultMessage="Manage booking rules, tax, payment instructions and terms for your company." />
                        </p>
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
                                    <FormattedMessage defaultMessage="Minimum Down Payment (%) / amount" />
                                </label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className={inputClass}
                                    value={data.minimum_down_payment}
                                    onChange={(e) => {
                                        const raw = e.target.value
                                            .replace(/[^0-9.,]/g, '')
                                            .replace(',', '.');

                                        setData('minimum_down_payment', raw);
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
                                    <FormattedMessage defaultMessage="Minimum Down Payment (amount) / Pax" />
                                </label>
                                <MoneyInput
                                    value={data.minimum_down_payment_value}
                                    className={inputClass}
                                    onChange={(raw) =>
                                        setData(
                                            'minimum_down_payment_value',
                                            raw,
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
                                            const raw = e.target.value
                                                .replace(/[^0-9.,]/g, '')
                                                .replace(',', '.');

                                            setData('minimum_vat', raw);
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

                                    {errors.document_completed_deadline && (
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
                        <h2 className="mb-5 text-lg font-semibold">
                            <FormattedMessage defaultMessage="Booking Terms & Conditions" />
                        </h2>

                        <textarea
                            rows={6}
                            className={`${inputClass} min-h-[140px] resize-y`}
                            value={data.term_conditions}
                            onChange={(e) =>
                                setData('term_conditions', e.target.value)
                            }
                        />

                        {errors.term_conditions && (
                            <p className="mt-1 text-sm text-red-500">
                                {errors.term_conditions}
                            </p>
                        )}
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
