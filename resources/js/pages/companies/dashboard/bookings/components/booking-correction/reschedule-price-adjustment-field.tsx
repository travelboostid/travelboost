import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormattedMessage } from 'react-intl';

type ReschedulePriceAdjustmentFieldProps = {
    priceDifference: number;
    value: boolean;
    onChange: (value: boolean) => void;
};

export default function ReschedulePriceAdjustmentField({
    priceDifference,
    value,
    onChange,
}: ReschedulePriceAdjustmentFieldProps) {
    if (Math.abs(priceDifference) < 0.01) {
        return null;
    }

    const isMoreExpensive = priceDifference > 0;

    return (
        <div className="space-y-2">
            <div className="grid gap-1.5">
                <Label className="text-xs font-medium">
                    <FormattedMessage defaultMessage="Apply price difference to customer?" />
                </Label>
                <RadioGroup
                    value={value ? 'yes' : 'no'}
                    onValueChange={(next) => onChange(next === 'yes')}
                    className="grid gap-2"
                >
                    <div className="flex items-start gap-2 rounded-md border bg-background px-3 py-2">
                        <RadioGroupItem
                            value="yes"
                            id="reschedule-price-adjustment-yes"
                            className="mt-0.5"
                        />
                        <Label
                            htmlFor="reschedule-price-adjustment-yes"
                            className="cursor-pointer text-xs font-normal leading-relaxed"
                        >
                            <FormattedMessage defaultMessage="Yes — charge or refund the customer for the price difference" />
                        </Label>
                    </div>
                    <div className="flex items-start gap-2 rounded-md border bg-background px-3 py-2">
                        <RadioGroupItem
                            value="no"
                            id="reschedule-price-adjustment-no"
                            className="mt-0.5"
                        />
                        <Label
                            htmlFor="reschedule-price-adjustment-no"
                            className="cursor-pointer text-xs font-normal leading-relaxed"
                        >
                            <FormattedMessage defaultMessage="No — vendor absorbs the difference (no extra charge or refund)" />
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {value && isMoreExpensive && (
                <p className="rounded-md border border-amber-200/70 bg-amber-50/80 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                    <FormattedMessage defaultMessage="The customer will be charged the additional balance. Booking status may change to down payment after reschedule." />
                </p>
            )}
            {value && !isMoreExpensive && (
                <p className="rounded-md border border-emerald-200/70 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
                    <FormattedMessage defaultMessage="A credit balance will be available. Arrange a refund to the customer for the price difference." />
                </p>
            )}
            {!value && isMoreExpensive && (
                <p className="rounded-md border border-slate-200/70 bg-slate-50/80 px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
                    <FormattedMessage defaultMessage="The customer will not be charged the price difference. Payment status will remain unchanged." />
                </p>
            )}
            {!value && !isMoreExpensive && (
                <p className="rounded-md border border-slate-200/70 bg-slate-50/80 px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
                    <FormattedMessage defaultMessage="The price difference will not be refunded to the customer." />
                </p>
            )}
        </div>
    );
}
