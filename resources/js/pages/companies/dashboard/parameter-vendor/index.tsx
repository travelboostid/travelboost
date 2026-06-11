import InputError from '@/components/input-error';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import MoneyInput from '@/components/ui/money-input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Banknote,
    CalendarClock,
    CreditCard,
    Eye,
    EyeOff,
    Info,
    Landmark,
    Save,
    ScrollText,
    SlidersHorizontal,
    type LucideIcon,
} from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { toast } from 'sonner';

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

type DecimalInputValue = string | number;

type ParameterVendorFormData = {
    booking_deadline: number;
    minimum_down_payment: DecimalInputValue;
    minimum_down_payment_value: number;
    minimum_vat: DecimalInputValue;
    term_conditions: string;
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

type SectionTone = 'primary' | 'sky' | 'emerald' | 'amber' | 'violet';

const sectionToneStyles: Record<
    SectionTone,
    { card: string; header: string; iconWrap: string }
> = {
    primary: {
        card: 'ring-1 ring-primary/10',
        header: 'border-b border-primary/15 bg-linear-to-r from-primary/12 via-primary/5 to-transparent',
        iconWrap:
            'bg-primary text-primary-foreground shadow-sm shadow-primary/25 ring-1 ring-primary/20',
    },
    sky: {
        card: 'ring-1 ring-sky-500/10',
        header: 'border-b border-sky-500/15 bg-linear-to-r from-sky-500/12 via-sky-500/5 to-transparent',
        iconWrap:
            'bg-sky-500 text-white shadow-sm shadow-sky-500/25 ring-1 ring-sky-500/20',
    },
    emerald: {
        card: 'ring-1 ring-emerald-500/10',
        header: 'border-b border-emerald-500/15 bg-linear-to-r from-emerald-500/12 via-emerald-500/5 to-transparent',
        iconWrap:
            'bg-emerald-600 text-white shadow-sm shadow-emerald-500/25 ring-1 ring-emerald-500/20',
    },
    amber: {
        card: 'ring-1 ring-amber-500/10',
        header: 'border-b border-amber-500/15 bg-linear-to-r from-amber-500/12 via-amber-500/5 to-transparent',
        iconWrap:
            'bg-amber-500 text-white shadow-sm shadow-amber-500/25 ring-1 ring-amber-500/20',
    },
    violet: {
        card: 'ring-1 ring-violet-500/10',
        header: 'border-b border-violet-500/15 bg-linear-to-r from-violet-500/12 via-violet-500/5 to-transparent',
        iconWrap:
            'bg-violet-600 text-white shadow-sm shadow-violet-500/25 ring-1 ring-violet-500/20',
    },
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

const parseNonNegativeInt = (value: string | number): number => {
    const parsed = parseInt(String(value).replace(/\D/g, ''), 10);

    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

function ParameterSectionHeader({
    icon: Icon,
    title,
    description,
    tone,
}: {
    icon: LucideIcon;
    title: ReactNode;
    description: ReactNode;
    tone: SectionTone;
}) {
    const style = sectionToneStyles[tone];

    return (
        <CardHeader
            className={cn('gap-0 px-6 py-4 [.border-b]:pb-4', style.header)}
        >
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl',
                        style.iconWrap,
                    )}
                >
                    <Icon className="size-5" />
                </div>
                <div className="min-w-0 space-y-1">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
            </div>
        </CardHeader>
    );
}

export default function ParameterVendorPage() {
    const intl = useIntl();
    const [showPassword, setShowPassword] = useState(false);

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

        post(window.location.pathname, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    intl.formatMessage({
                        defaultMessage:
                            'Vendor parameters updated successfully.',
                    }),
                );
            },
        });
    };

    const hasPercentage = parseDecimalInput(data.minimum_down_payment) > 0;
    const hasAmount = Number(data.minimum_down_payment_value || 0) > 0;

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

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4 pb-20 sm:p-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <SlidersHorizontal className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                    <FormattedMessage defaultMessage="Vendor parameters" />
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    <FormattedMessage defaultMessage="Configure booking deadlines, payment rules, bank details, and terms shown to customers." />
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <form onSubmit={submit} className="space-y-6">
                    <Card
                        className={cn(
                            'overflow-hidden border shadow-sm gap-0 py-0',
                            sectionToneStyles.primary.card,
                        )}
                    >
                        <ParameterSectionHeader
                            icon={CalendarClock}
                            tone="primary"
                            title={
                                <FormattedMessage defaultMessage="Booking entry rules" />
                            }
                            description={
                                <FormattedMessage defaultMessage="Control when customers can book, how long reservations are held, and document deadlines." />
                            }
                        />
                        <CardContent className="grid gap-4 px-6 pt-6 pb-6 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="booking_deadline">
                                    <FormattedMessage defaultMessage="Entry deadline" />
                                </Label>
                                <InputGroup>
                                    <InputGroupInput
                                        id="booking_deadline"
                                        inputMode="numeric"
                                        value={String(data.booking_deadline)}
                                        onChange={(e) =>
                                            setData(
                                                'booking_deadline',
                                                parseNonNegativeInt(
                                                    e.target.value,
                                                ),
                                            )
                                        }
                                    />
                                    <InputGroupAddon
                                        align="inline-end"
                                        className="bg-muted text-muted-foreground"
                                    >
                                        <FormattedMessage defaultMessage="days before departure" />
                                    </InputGroupAddon>
                                </InputGroup>
                                <FieldDescription>
                                    <FormattedMessage defaultMessage="Last day a customer can start a booking before the tour departs." />
                                </FieldDescription>
                                <InputError message={errors.booking_deadline} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="booking_entry_time_limit">
                                    <FormattedMessage defaultMessage="Reservation hold time" />
                                </Label>
                                <InputGroup>
                                    <InputGroupInput
                                        id="booking_entry_time_limit"
                                        inputMode="numeric"
                                        value={String(
                                            data.booking_entry_time_limit,
                                        )}
                                        onChange={(e) =>
                                            setData(
                                                'booking_entry_time_limit',
                                                parseNonNegativeInt(
                                                    e.target.value,
                                                ),
                                            )
                                        }
                                    />
                                    <InputGroupAddon
                                        align="inline-end"
                                        className="bg-muted text-muted-foreground"
                                    >
                                        <FormattedMessage defaultMessage="minutes" />
                                    </InputGroupAddon>
                                </InputGroup>
                                <FieldDescription>
                                    <FormattedMessage defaultMessage="How long an unpaid booking stays reserved before it expires." />
                                </FieldDescription>
                                <InputError
                                    message={errors.booking_entry_time_limit}
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                                <Label htmlFor="document_completed_deadline">
                                    <FormattedMessage defaultMessage="Document deadline" />
                                </Label>
                                <InputGroup>
                                    <InputGroupInput
                                        id="document_completed_deadline"
                                        inputMode="numeric"
                                        value={String(
                                            data.document_completed_deadline,
                                        )}
                                        onChange={(e) =>
                                            setData(
                                                'document_completed_deadline',
                                                parseNonNegativeInt(
                                                    e.target.value,
                                                ),
                                            )
                                        }
                                    />
                                    <InputGroupAddon
                                        align="inline-end"
                                        className="bg-muted text-muted-foreground"
                                    >
                                        <FormattedMessage defaultMessage="days before departure" />
                                    </InputGroupAddon>
                                </InputGroup>
                                <FieldDescription>
                                    <FormattedMessage defaultMessage="Deadline for customers to complete required travel documents." />
                                </FieldDescription>
                                <InputError
                                    message={errors.document_completed_deadline}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className={cn(
                            'overflow-hidden border shadow-sm gap-0 py-0',
                            sectionToneStyles.amber.card,
                        )}
                    >
                        <ParameterSectionHeader
                            icon={Banknote}
                            tone="amber"
                            title={
                                <FormattedMessage defaultMessage="Booking payment rules" />
                            }
                            description={
                                <FormattedMessage defaultMessage="Set down payment, tax, and full-payment deadlines applied at checkout." />
                            }
                        />
                        <CardContent className="space-y-4 px-6 pt-6 pb-6">
                            <Alert className="border-amber-500/20 bg-amber-500/5">
                                <Info className="text-amber-600" />
                                <AlertDescription>
                                    <FormattedMessage defaultMessage="Choose either a percentage of the base price or a fixed amount per passenger for the minimum down payment — not both." />
                                </AlertDescription>
                            </Alert>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="minimum_down_payment">
                                        <FormattedMessage defaultMessage="Minimum down payment" />
                                    </Label>
                                    <InputGroup
                                        className={cn(
                                            hasAmount && 'opacity-60',
                                        )}
                                    >
                                        <InputGroupInput
                                            id="minimum_down_payment"
                                            type="text"
                                            inputMode="decimal"
                                            disabled={hasAmount}
                                            value={data.minimum_down_payment}
                                            onChange={(e) =>
                                                setData(
                                                    'minimum_down_payment',
                                                    normalizeDecimalInput(
                                                        e.target.value,
                                                    ),
                                                )
                                            }
                                        />
                                        <InputGroupAddon
                                            align="inline-end"
                                            className="bg-muted text-muted-foreground"
                                        >
                                            %
                                        </InputGroupAddon>
                                    </InputGroup>
                                    <FieldDescription>
                                        <FormattedMessage defaultMessage="Percentage of the total base price required upfront." />
                                    </FieldDescription>
                                    <InputError
                                        message={errors.minimum_down_payment}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="minimum_down_payment_value">
                                        <FormattedMessage defaultMessage="Minimum down payment per pax" />
                                    </Label>
                                    <MoneyInput
                                        value={data.minimum_down_payment_value}
                                        disabled={hasPercentage}
                                        className={cn(
                                            hasPercentage && 'opacity-60',
                                        )}
                                        onChange={(raw) =>
                                            setData(
                                                'minimum_down_payment_value',
                                                Number(raw || 0),
                                            )
                                        }
                                    />
                                    <FieldDescription>
                                        <FormattedMessage defaultMessage="Fixed amount per passenger required upfront." />
                                    </FieldDescription>
                                    <InputError
                                        message={
                                            errors.minimum_down_payment_value
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="minimum_vat">
                                        <FormattedMessage defaultMessage="VAT" />
                                    </Label>
                                    <InputGroup>
                                        <InputGroupInput
                                            id="minimum_vat"
                                            type="text"
                                            inputMode="decimal"
                                            value={data.minimum_vat}
                                            onChange={(e) =>
                                                setData(
                                                    'minimum_vat',
                                                    normalizeDecimalInput(
                                                        e.target.value,
                                                    ),
                                                )
                                            }
                                        />
                                        <InputGroupAddon
                                            align="inline-end"
                                            className="bg-muted text-muted-foreground"
                                        >
                                            %
                                        </InputGroupAddon>
                                    </InputGroup>
                                    <FieldDescription>
                                        <FormattedMessage defaultMessage="Value-added tax applied to bookings. Set to 0 if not applicable." />
                                    </FieldDescription>
                                    <InputError message={errors.minimum_vat} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="full_payment_deadline">
                                        <FormattedMessage defaultMessage="Full payment deadline" />
                                    </Label>
                                    <InputGroup>
                                        <InputGroupInput
                                            id="full_payment_deadline"
                                            inputMode="numeric"
                                            value={String(
                                                data.full_payment_deadline,
                                            )}
                                            onChange={(e) =>
                                                setData(
                                                    'full_payment_deadline',
                                                    parseNonNegativeInt(
                                                        e.target.value,
                                                    ),
                                                )
                                            }
                                        />
                                        <InputGroupAddon
                                            align="inline-end"
                                            className="bg-muted text-muted-foreground"
                                        >
                                            <FormattedMessage defaultMessage="days before departure" />
                                        </InputGroupAddon>
                                    </InputGroup>
                                    <FieldDescription>
                                        <FormattedMessage defaultMessage="Last day the remaining balance must be paid before departure." />
                                    </FieldDescription>
                                    <InputError
                                        message={errors.full_payment_deadline}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className={cn(
                            'overflow-hidden border shadow-sm gap-0 py-0',
                            sectionToneStyles.sky.card,
                        )}
                    >
                        <ParameterSectionHeader
                            icon={Landmark}
                            tone="sky"
                            title={
                                <FormattedMessage defaultMessage="Manual bank transfer" />
                            }
                            description={
                                <FormattedMessage defaultMessage="Bank account details shown to customers who pay via manual transfer." />
                            }
                        />
                        <CardContent className="grid gap-4 px-6 pt-6 pb-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="manual_bank_transfer">
                                    <FormattedMessage defaultMessage="Bank name" />
                                </Label>
                                <Input
                                    id="manual_bank_transfer"
                                    value={data.manual_bank_transfer}
                                    onChange={(e) =>
                                        setData(
                                            'manual_bank_transfer',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="BCA, Mandiri, BRI…"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="manual_bank_transfer_account_name">
                                    <FormattedMessage defaultMessage="Account name" />
                                </Label>
                                <Input
                                    id="manual_bank_transfer_account_name"
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

                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="manual_bank_transfer_account_number">
                                    <FormattedMessage defaultMessage="Account number" />
                                </Label>
                                <Input
                                    id="manual_bank_transfer_account_number"
                                    value={
                                        data.manual_bank_transfer_account_number
                                    }
                                    onChange={(e) =>
                                        setData(
                                            'manual_bank_transfer_account_number',
                                            e.target.value,
                                        )
                                    }
                                    className="font-mono tracking-wider"
                                    inputMode="numeric"
                                />
                                <FieldDescription>
                                    <FormattedMessage defaultMessage="Displayed on invoices and payment instructions." />
                                </FieldDescription>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className={cn(
                            'overflow-hidden border shadow-sm gap-0 py-0',
                            sectionToneStyles.violet.card,
                        )}
                    >
                        <ParameterSectionHeader
                            icon={CreditCard}
                            tone="violet"
                            title={
                                <FormattedMessage defaultMessage="Payment gateway credentials" />
                            }
                            description={
                                <FormattedMessage defaultMessage="Login credentials for your online payment provider. Stored securely and never shown to customers." />
                            }
                        />
                        <CardContent className="grid gap-4 px-6 pt-6 pb-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="email_payment_gateway">
                                    <FormattedMessage defaultMessage="Gateway email" />
                                </Label>
                                <Input
                                    id="email_payment_gateway"
                                    type="email"
                                    autoComplete="off"
                                    value={data.email_payment_gateway}
                                    onChange={(e) =>
                                        setData(
                                            'email_payment_gateway',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={errors.email_payment_gateway}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_payment_gateway">
                                    <FormattedMessage defaultMessage="Gateway password" />
                                </Label>
                                <InputGroup>
                                    <InputGroupInput
                                        id="password_payment_gateway"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        autoComplete="new-password"
                                        value={data.password_payment_gateway}
                                        onChange={(e) =>
                                            setData(
                                                'password_payment_gateway',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputGroupAddon align="inline-end">
                                        <InputGroupButton
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label={
                                                showPassword
                                                    ? intl.formatMessage({
                                                          defaultMessage:
                                                              'Hide password',
                                                      })
                                                    : intl.formatMessage({
                                                          defaultMessage:
                                                              'Show password',
                                                      })
                                            }
                                            onClick={() =>
                                                setShowPassword((v) => !v)
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff className="size-4" />
                                            ) : (
                                                <Eye className="size-4" />
                                            )}
                                        </InputGroupButton>
                                    </InputGroupAddon>
                                </InputGroup>
                                <InputError
                                    message={errors.password_payment_gateway}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className={cn(
                            'overflow-hidden border shadow-sm gap-0 py-0',
                            sectionToneStyles.emerald.card,
                        )}
                    >
                        <ParameterSectionHeader
                            icon={ScrollText}
                            tone="emerald"
                            title={
                                <FormattedMessage defaultMessage="Booking terms & conditions" />
                            }
                            description={
                                <FormattedMessage defaultMessage="Legal terms displayed during checkout. Leave blank to hide from customers." />
                            }
                        />
                        <CardContent className="space-y-2 px-6 pt-6 pb-6">
                            <Textarea
                                id="term_conditions"
                                rows={8}
                                className="min-h-[180px] resize-y"
                                value={data.term_conditions}
                                onChange={(e) =>
                                    setData('term_conditions', e.target.value)
                                }
                                placeholder={intl.formatMessage({
                                    defaultMessage:
                                        'Enter cancellation policy, refund rules, and other booking conditions…',
                                })}
                            />
                            <div className="flex items-center justify-between gap-2">
                                <FieldDescription>
                                    <FormattedMessage defaultMessage="Supports plain text. Shown in a scrollable panel at checkout." />
                                </FieldDescription>
                                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                    {data.term_conditions.length}{' '}
                                    <FormattedMessage defaultMessage="characters" />
                                </span>
                            </div>
                            <InputError message={errors.term_conditions} />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={processing}
                            size="lg"
                            className="h-11 w-full sm:w-auto"
                        >
                            {processing ? (
                                <Spinner className="mr-2" />
                            ) : (
                                <Save className="mr-2 size-4" />
                            )}
                            <FormattedMessage defaultMessage="Save changes" />
                        </Button>
                    </div>
                </form>
            </div>
        </CompanyDashboardLayout>
    );
}
