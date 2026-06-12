import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FormattedMessage, useIntl } from 'react-intl';

type ProductCommissionCategory = {
    id: number;
    category_name: string;
};

type Props = {
    value?: number;
    onChange: (value: string) => void;
    categories?: ProductCommissionCategory[];
    name?: string;
};

export default function SelectProductCommissionCategory({
    value,
    onChange,
    categories = [],
}: Props) {
    const selectedCategory = categories.find((item) => item.id === value);
    const intl = useIntl();

    return (
        <Select value={value ? String(value) : '0'} onValueChange={onChange}>
            <SelectTrigger className="w-full min-w-0">
                <SelectValue
                    placeholder={intl.formatMessage({
                        defaultMessage: 'Select Product Commission Category',
                    })}
                >
                    <span className="block truncate">
                        {selectedCategory?.category_name ??
                            intl.formatMessage({
                                defaultMessage: 'No Category',
                            })}
                    </span>
                </SelectValue>
            </SelectTrigger>

            <SelectContent>
                <SelectItem value="0">
                    <FormattedMessage defaultMessage="No Category" />
                </SelectItem>
                {categories.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                        {item.category_name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
