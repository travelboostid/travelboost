import { useGetCountries } from '@/api/country/country';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

interface SelectCountryProps {
  continentId: number | null; // ⬅️ WAJIB
  regionId: number | null; // ⬅️ WAJIB
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
}

export default function SelectCountry({
  continentId,
  regionId,
  name = 'country_id',
  value,
  defaultValue,
  onChange,
  }: SelectCountryProps) {
    const { data, isLoading } = useGetCountries(
      continentId || regionId
        ? {
            continent_id: continentId ?? undefined,
            region_id: regionId ?? undefined,
          }
        : undefined
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
          placeholder={isLoading ? 'Loading...' : 'Select country'}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Country</SelectLabel>
          {data?.data.map((cat) => (
            <SelectItem key={cat.id} value={cat.id.toString()}>
              {cat.country}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
