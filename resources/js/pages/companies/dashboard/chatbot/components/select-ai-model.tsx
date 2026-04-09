import { useGetAiModels } from '@/api/ai-model/ai-model';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SelectAiModelProps {
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
}

export default function SelectAiModel({
  name,
  value,
  defaultValue,
  onChange,
}: SelectAiModelProps) {
  const { data, isLoading } = useGetAiModels();

  return (
    <Select
      name={name}
      value={value?.toString()}
      defaultValue={defaultValue?.toString()}
      onValueChange={(val) => onChange && onChange(val)}
    >
      <SelectTrigger className="w-full max-w-xs">
        <SelectValue
          placeholder={isLoading ? 'Loading...' : 'Select AI Model'}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>AI Model</SelectLabel>
          {data?.data.map((cat) => (
            <SelectItem key={cat.id} value={cat.id.toString()}>
              {cat.code}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
