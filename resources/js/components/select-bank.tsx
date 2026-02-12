import { useGetBankAccounts } from '@/api/bank-account/bank-account';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SelectCategoryProps {
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
}

export default function SelectBank({
  name = 'category_id',
  value,
  defaultValue,
  onChange,
}: SelectCategoryProps) {
  const { data, isLoading } = useGetBankAccounts();

  return (
    <Select
      name={name}
      value={value?.toString()}
      defaultValue={defaultValue?.toString()}
      onValueChange={(val) => onChange && onChange(val)}
    >
      <SelectTrigger className="w-full max-w-xs">
        <SelectValue placeholder={isLoading ? 'Loading...' : 'Select banks'} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Bank Account</SelectLabel>
          {data?.data.map((cat) => (
            <SelectItem key={cat.id} value={cat.id.toString()}>
              {cat.account_number} - {cat.provider}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
