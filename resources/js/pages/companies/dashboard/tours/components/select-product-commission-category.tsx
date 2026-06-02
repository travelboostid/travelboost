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
    return (
        <Select
            value={value ? String(value) : undefined}
            onValueChange={onChange}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Product Commission Category" />
            </SelectTrigger>

            <SelectContent>
                {categories.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                        {item.category_name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
