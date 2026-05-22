import { useGetGeoCities } from '@/api/geo-city/geo-city';
import type { GeoCityResource } from '@/api/model';
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

type GeoCitySelectorProps = Omit<
    ComponentProps<typeof SelectPrimitive.Root>,
    'children'
> & {
    provinceId: number;
    onSelected?: (province: GeoCityResource) => void;
};

export default function GeoCitySelector({
    disabled,
    provinceId,
    onValueChange,
    onSelected,
    ...otherProps
}: GeoCitySelectorProps) {
    const query = useGetGeoCities(
        { province_id: provinceId },
        {
            query: {
                enabled: !!provinceId,
                queryKey: ['geo-cities', provinceId],
            },
        },
    );
    const cities = query.data?.data || [];

    const handleOnValueChange = (value: string) => {
        onValueChange?.(value);
        const selected = cities.find((v: any) => v.id === parseInt(value));
        if (selected) {
            onSelected?.(selected);
        }
    };

    return (
        <Select
            disabled={disabled || !provinceId || query.isLoading}
            onValueChange={handleOnValueChange}
            {...otherProps}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a city" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Cities</SelectLabel>
                    {cities.map((city: any) => (
                        <SelectItem key={city.id} value={city.id}>
                            {city.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
