import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import usePageProps from '@/hooks/use-page-props';
import { index } from '@/routes/companies/dashboard/withdrawals';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { CalendarIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import type { WithdrawalsPageProps } from '..';

export default function FilterBar() {
  const { filters, company } = usePageProps<WithdrawalsPageProps>();
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (filters?.from) {
      return {
        from: dayjs(filters.from).toDate(),
        to: filters?.to ? dayjs(filters.to).toDate() : undefined,
      };
    }
    return undefined;
  });
  console.log('Current filters:', filters);
  const rangeDisplayText = useMemo(() => {
    if (!filters?.from) return 'Select date range';
    if (filters.to)
      return `${format(filters.from, 'MMM dd, yyyy')} - ${format(filters.to, 'MMM dd, yyyy')}`;
    return format(filters.from, 'MMM dd, yyyy');
  }, [filters]);

  const handleChangeFilters = (partialFilters: any) => {
    const newFilters: any = Object.fromEntries(
      Object.entries({
        ...filters,
        ...partialFilters,
      }).filter(([_, value]) => value !== undefined),
    );

    router.get(index({ company: company.username }), newFilters, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <CalendarIcon className="w-4 h-4" />
            {rangeDisplayText}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={range}
            onSelect={(range) => {
              handleChangeFilters({
                from: range?.from
                  ? dayjs(range.from).format('YYYY-MM-DD')
                  : undefined,
                to: range?.to
                  ? dayjs(range.to).format('YYYY-MM-DD')
                  : undefined,
              });
              setRange(range);
            }}
            numberOfMonths={2}
            className="rounded-md border"
          />
        </PopoverContent>
      </Popover>

      {/* Status Filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(status) =>
          handleChangeFilters({ status: status === 'all' ? undefined : status })
        }
      >
        <SelectTrigger className="w-40 h-9">
          <SelectValue placeholder="Any Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex-1" />

      {/* Sort Button - EXACT same as payments */}
      <Select
        value={filters.sort || '-created_at'}
        onValueChange={(sort) => handleChangeFilters({ sort })}
      >
        <SelectTrigger className="w-40 h-9">
          <SelectValue placeholder="Sort..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="-created_at">Newest first</SelectItem>
          <SelectItem value="created_at">Older first</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
