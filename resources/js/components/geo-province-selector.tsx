import { useGetGeoProvinces } from '@/api/geo-province/geo-province';
import type { GeoProvinceResource } from '@/api/model';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Select as SelectPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

type GeoProvinceSelectorProps = Omit<
    ComponentProps<typeof SelectPrimitive.Root>,
    'children'
> & {
    onSelected?: (province: GeoProvinceResource) => void;
};

export default function GeoProvinceSelector({
    disabled,
    onValueChange,
    onSelected,
    ...otherProps
}: GeoProvinceSelectorProps) {
    const query = useGetGeoProvinces({
        query: {
            queryKey: ['geo-provinces'],
        },
    });
    const provinces = query.data?.data || [];

    const handleOnValueChange = (value: string) => {
        onValueChange?.(value);
        const selected = provinces.find((v: any) => v.id === parseInt(value));
        if (selected) {
            onSelected?.(selected);
        }
    };

    return (
        <Select
            disabled={disabled || query.isLoading}
            onValueChange={handleOnValueChange}
            {...otherProps}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a province" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Provinces</SelectLabel>
                    {provinces.map((province: any) => (
                        <SelectItem key={province.id} value={province.id}>
                            {province.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
