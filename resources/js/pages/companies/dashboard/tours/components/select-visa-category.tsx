import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type VisaCategory = {
    id: number;
    name: string;
};

type Props = {
    value?: number | string;
    onChange: (value: string) => void;
    categories?: VisaCategory[];
};

export default function SelectVisaCategory({
    value,
    onChange,
    categories = [],
}: Props) {
    const selectedCategory = categories.find(
        (item) => String(item.id) === String(value ?? '0'),
    );

    return (
        <Select value={value ? String(value) : '0'} onValueChange={onChange}>
            <SelectTrigger className="w-full min-w-0">
                <SelectValue placeholder={undefined}>
                    <span className="block truncate">
                        {selectedCategory?.name ?? 'No Visa Category'}
                    </span>
                </SelectValue>
            </SelectTrigger>

            <SelectContent>
                <SelectItem value="0">No Visa Category</SelectItem>
                {categories.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
