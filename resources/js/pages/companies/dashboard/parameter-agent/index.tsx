import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormattedMessage, useIntl } from 'react-intl';

type Settings = {
    booking_deadline: number;
    minimum_down_payment: number;
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

export default function ParameterAgentPage() {
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

                minimum_vat:
                    parseFloat(String(data.minimum_vat).replace(',', '.')) || 0,
            },
        });
    };

    const inputClass =
        'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary sm:px-4 sm:py-2.5';
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
                        defaultMessage: 'Agent Parameters',
                    }),
                },
            ]}
            openMenuIds={['settings']}
            activeMenuIds={['settings.parameter-agent']}
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Agent Parameters',
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
                            <FormattedMessage defaultMessage="Manage payment instructions for your company." />
                        </p>
                    </div>
                </div>

                {props.flash?.success && (
                    <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm">
                        {props.flash.success}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
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
