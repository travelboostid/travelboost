import { useGetUsers } from '@/api/user/user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { DEFAULT_PHOTO } from '@/config';
import { UserIcon, UserPlus2Icon, XCircleIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDebounce } from 'react-use';

type UserPickerProps = {
  value?: string | null | undefined;
  onChange?: (v: string | null | undefined) => void;
};

export default function UserPicker({ value, onChange }: UserPickerProps) {
  const [internalValue, setInternalValue] = useState<string | null | undefined>(
    value,
  );

  const handleChange = (value?: string | null | undefined) => {
    setInternalValue(value);
    onChange?.(value);
  };
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const isDebouncedSearchEmail = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(debouncedSearch);
  }, [debouncedSearch]);
  useDebounce(() => setDebouncedSearch(search), 2000, [search]);

  const { data } = useGetUsers({ search: debouncedSearch });
  const users = data?.data;

  if (internalValue) {
    return (
      <InputGroup>
        <InputGroupInput value={internalValue} disabled />
        <InputGroupAddon onClick={() => handleChange('')} align="inline-end">
          <XCircleIcon />
        </InputGroupAddon>
      </InputGroup>
    );
  }
  return (
    <Command className="max-w-sm rounded-lg border" shouldFilter={false}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      {!debouncedSearch && (
        <CommandList>
          <CommandEmpty>Enter email or username to start</CommandEmpty>
        </CommandList>
      )}
      <CommandList className="relative">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {users?.map((user) => (
            <CommandItem
              key={user.email}
              onSelect={() => handleChange(user.email)}
              className="flex gap-2"
            >
              <Avatar className="h-6 w-6 rounded-lg">
                <AvatarImage
                  src={user.photo_url || DEFAULT_PHOTO}
                  alt={user.name}
                />
                <AvatarFallback>
                  <UserIcon />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">
                  {user.email}
                </div>
              </div>
            </CommandItem>
          ))}
          {!users?.length && isDebouncedSearchEmail && (
            <CommandItem
              key={debouncedSearch}
              onSelect={() => handleChange(debouncedSearch)}
            >
              <UserPlus2Icon />
              <span>Invite {debouncedSearch}</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
