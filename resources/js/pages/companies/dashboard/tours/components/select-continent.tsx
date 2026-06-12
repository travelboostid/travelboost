import { useGetContinents } from '@/api/continent/continent';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FormattedMessage, useIntl } from 'react-intl';

interface SelectContinentProps {
    name?: string;
    value?: string | number;
    defaultValue?: string | number;
    onChange?: (value: string | number) => void;
}

export default function SelectContinent({
    name = 'continent_id',
    value,
    defaultValue,
    onChange,
}: SelectContinentProps) {
    const intl = useIntl();
    const { data, isLoading } = useGetContinents();

    return (
        <Select
            name={name}
            value={value?.toString()}
            defaultValue={defaultValue?.toString()}
            onValueChange={(val) => onChange && onChange(val)}
        >
            <SelectTrigger className="w-full max-w-xs">
                <SelectValue
                    placeholder={
                        isLoading
                            ? intl.formatMessage({
                                  defaultMessage: 'Loading...',
                              })
                            : intl.formatMessage({
                                  defaultMessage: 'Select continent',
                              })
                    }
                />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>
                        <FormattedMessage defaultMessage="Continent" />
                    </SelectLabel>
                    {data?.data.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
