import { useGetGeoVillages } from '@/api/geo-village/geo-village';
import type { GeoVillageResource } from '@/api/model';
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

type GeoVillageSelectorProps = {
    districtId: number;
    onSelected?: (province: GeoVillageResource) => void;
} & Omit<ComponentProps<typeof SelectPrimitive.Root>, 'children'>;

export default function GeoVillageSelector({
    disabled,
    districtId,
    onValueChange,
    onSelected,
    ...otherProps
}: GeoVillageSelectorProps) {
    const query = useGetGeoVillages(
        { district_id: districtId },
        {
            query: {
                enabled: !!districtId,
                queryKey: ['geo-villages', districtId],
            },
        },
    );
    const villages = query.data?.data || [];

    const handleOnValueChange = (value: string) => {
        onValueChange?.(value);
        const selected = villages.find((v: any) => v.id === parseInt(value));
        if (selected) {
            onSelected?.(selected);
        }
    };

    return (
        <Select
            disabled={disabled || !districtId || query.isLoading}
            onValueChange={handleOnValueChange}
            {...otherProps}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a village" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Villages</SelectLabel>
                    {villages.map((village: any) => (
                        <SelectItem key={village.id} value={village.id}>
                            {village.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
