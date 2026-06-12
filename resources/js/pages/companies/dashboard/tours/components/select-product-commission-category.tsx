import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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

    return (
        <Select value={value ? String(value) : '0'} onValueChange={onChange}>
            <SelectTrigger className="w-full min-w-0">
                <SelectValue placeholder={undefined}>
                    <span className="block truncate">
                        {selectedCategory?.category_name ?? 'No Category'}
                    </span>
                </SelectValue>
            </SelectTrigger>

            <SelectContent>
                <SelectItem value="0">No Category</SelectItem>
                {categories.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                        {item.category_name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
