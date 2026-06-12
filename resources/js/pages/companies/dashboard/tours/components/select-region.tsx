import { useGetRegions } from '@/api/region/region';
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

interface SelectRegionProps {
    continentId: number | null;
    name?: string;
    value?: string | number;
    defaultValue?: string | number;
    onChange?: (value: string | number) => void;
}

export default function SelectRegion({
    continentId,
    name = 'region_id',
    value,
    defaultValue,
    onChange,
}: SelectRegionProps) {
    const intl = useIntl();
    const { data, isLoading } = useGetRegions(
        continentId ? { continent_id: continentId } : undefined,
    );

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
                                  defaultMessage: 'Select region',
                              })
                    }
                />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>
                        <FormattedMessage defaultMessage="Region" />
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
