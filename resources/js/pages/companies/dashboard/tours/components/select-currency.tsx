import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { FormattedMessage, useIntl } from 'react-intl';

interface SelectCurrencyProps {
    name?: string;
    value?: string | number;
    defaultValue?: string | number;
    onChange?: (value: string) => void;
}

export default function SelectCurrency({
    name = 'currency',
    value,
    defaultValue,
    onChange,
}: SelectCurrencyProps) {
    const intl = useIntl();
    const { currencies } = usePageSharedDataProps();

    return (
        <Select
            name={name}
            value={value?.toString()}
            defaultValue={defaultValue?.toString()}
            onValueChange={(val) => onChange && onChange(val)}
            modal={false}
        >
            <SelectTrigger className="w-[120px]">
                <SelectValue
                    placeholder={
                        currencies?.length
                            ? intl.formatMessage({
                                  defaultMessage: 'Select currency',
                              })
                            : intl.formatMessage({
                                  defaultMessage: 'No currency',
                              })
                    }
                />
            </SelectTrigger>

            <SelectContent position="popper" className="z-[9999]">
                <SelectGroup>
                    <SelectLabel>
                        <FormattedMessage defaultMessage="Currency" />
                    </SelectLabel>

                    {currencies?.map((c: any) => (
                        <SelectItem key={c.code} value={c.code}>
                            {c.code} {c.name ? `- ${c.name}` : ''}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
