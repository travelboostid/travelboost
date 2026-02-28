import { useGetTourCategories } from '@/api/tour-category/tour-category';
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

interface SelectCategoryProps {
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
}

export default function SelectCategory({
  name = 'category_id',
  value,
  defaultValue,
  onChange,
}: SelectCategoryProps) {
  const { company } = usePageSharedDataProps();
  const { data, isLoading } = useGetTourCategories({
    company_id: company.id,
  });

  return (
    <Select
      name={name}
      value={value?.toString()}
      defaultValue={defaultValue?.toString()}
      onValueChange={(val) => onChange && onChange(val)}
    >
      <SelectTrigger className="w-full max-w-xs">
        <SelectValue
          placeholder={isLoading ? 'Loading...' : 'Select category'}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Category</SelectLabel>
          {data?.data.map((cat) => (
            <SelectItem key={cat.id} value={cat.id.toString()}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
