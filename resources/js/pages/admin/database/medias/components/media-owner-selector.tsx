'use client';

import { Check } from 'lucide-react';

import { useAdminSearchResourceOwners } from '@/api/misc/misc';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';

type Option = {
    name: string;
    type: string;
    value: string;
};

interface MediaOwnerSelectorProps {
    defaultValue?: string;
    value?: string;
    onChange?: (value: string | undefined) => void;
}

export default function MediaOwnerSelector({
    defaultValue,
    value,
    onChange,
}: MediaOwnerSelectorProps) {
    const [internalValue, setInternalValue] = useState<string | undefined>(
        value ?? defaultValue,
    );
    const handleChangeValue = (newValue: string | undefined) => {
        setInternalValue(newValue);
        onChange?.(newValue);
    };

    const [open, setOpen] = useState(false);
    const [queryParams, setQueryParams] = useState<any>({
        types: 'company,user',
    });
    const query = useAdminSearchResourceOwners({
        ...queryParams,
        include_ids: internalValue,
    });
    const options = useMemo(() => {
        const companies = (query.data?.data.companies || []) as any[];
        const users = (query.data?.data.users || []) as any[];

        return [
            ...companies.map((company) => ({
                name: company.name,
                type: 'company',
                value: `company:${company.id}`,
            })),
            ...users.map((user) => ({
                name: user.name,
                type: 'user',
                value: `user:${user.id}`,
            })),
        ];
    }, [query.data]);

    const selectedOption = options.find(
        (option) => option.value === internalValue,
    );

    const handleSelectItem = (option?: Option) => {
        handleChangeValue(option?.value);
        setOpen(false);
    };

    const debouncedSetQueryParams = useDebouncedCallback((params: any) => {
        setQueryParams(params);
    }, 500);

    return (
        <div>
            <Input
                onClick={() => setOpen(true)}
                value={
                    selectedOption
                        ? `${selectedOption.name} (${selectedOption.type})`
                        : ''
                }
                placeholder="Select owner..."
                readOnly
            />
            <CommandDialog onOpenChange={setOpen} open={open}>
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search owners..."
                        onValueChange={(v) =>
                            debouncedSetQueryParams((v) => ({ ...v, query: v }))
                        }
                    />
                    {query.isLoading && <CommandEmpty>Loading...</CommandEmpty>}
                    {!query.isLoading && (
                        <CommandList className="max-h-full">
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup className="scroll-py-1 overflow-y-auto overflow-x-hidden">
                                {options.map((option) => {
                                    const isSelected =
                                        option.value === internalValue;
                                    return (
                                        <CommandItem
                                            key={option.value}
                                            onSelect={() =>
                                                handleSelectItem(option)
                                            }
                                        >
                                            <div
                                                className={cn(
                                                    'flex size-4 items-center justify-center rounded-sm border border-primary',
                                                    isSelected
                                                        ? 'bg-primary'
                                                        : 'opacity-50 [&_svg]:invisible',
                                                )}
                                            >
                                                <Check />
                                            </div>

                                            <span className="truncate">
                                                {option.name}
                                            </span>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                            {!!internalValue && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup>
                                        <CommandItem
                                            onSelect={() =>
                                                handleSelectItem(undefined)
                                            }
                                            className="justify-center text-center"
                                        >
                                            Clear selection
                                        </CommandItem>
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    )}
                </Command>
            </CommandDialog>
        </div>
    );
}
