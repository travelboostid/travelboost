import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';

interface SelectCurrencyProps {
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string) => void;
}

export default function SelectCurrency({
  name = 'currency',
  value,
  defaultValue,
  onChange,
}: SelectCurrencyProps) {
  const { currencies } = usePageSharedDataProps();

  return (
    <Select
      name={name}
      value={value?.toString()}
      defaultValue={defaultValue?.toString()}
      onValueChange={(val) => onChange && onChange(val)}
      modal={false}
    >
      <SelectTrigger className="w-[120px]">
        <SelectValue
          placeholder={currencies?.length ? 'Select currency' : 'No currency'}
        />
      </SelectTrigger>

      <SelectContent position="popper" className="z-[9999]">
        <SelectGroup>
          <SelectLabel>Currency</SelectLabel>

          {currencies?.map((c: any) => (
            <SelectItem key={c.code} value={c.code}>
              {c.code} {c.name ? `- ${c.name}` : ''}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
