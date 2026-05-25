import { useGetGeoDistricts } from '@/api/geo-district/geo-district';
import type { GeoDistrictResource } from '@/api/model';
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

type GeoDistrictSelectorProps = Omit<
    ComponentProps<typeof SelectPrimitive.Root>,
    'children'
> & {
    cityId: number;
    onSelected?: (province: GeoDistrictResource) => void;
};

export default function GeoDistrictSelector({
    disabled,
    cityId,
    onValueChange,
    onSelected,
    ...otherProps
}: GeoDistrictSelectorProps) {
    const query = useGetGeoDistricts(
        { city_id: cityId },
        {
            query: {
                enabled: !!cityId,
                queryKey: ['geo-districts', cityId],
            },
        },
    );
    const districts = query.data?.data || [];

    const handleOnValueChange = (value: string) => {
        onValueChange?.(value);
        const selected = districts.find((v: any) => v.id === parseInt(value));
        if (selected) {
            onSelected?.(selected);
        }
    };

    return (
        <Select
            disabled={disabled || !cityId || query.isLoading}
            onValueChange={handleOnValueChange}
            {...otherProps}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a district" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Districts</SelectLabel>
                    {districts.map((district: any) => (
                        <SelectItem key={district.id} value={district.id}>
                            {district.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
