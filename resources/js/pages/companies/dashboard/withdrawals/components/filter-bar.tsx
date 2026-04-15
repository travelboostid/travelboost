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
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

export default function FilterBar({
  dateRange,
  onDateRangeChange,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
}: {
  dateRange?: DateRange;
  onDateRangeChange: (range?: DateRange) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortOrder: 'newest' | 'oldest';
  onSortOrderChange: (value: 'newest' | 'oldest') => void;
}) {
  const getDateRangeDisplayText = (range: DateRange | undefined): string => {
    if (!range?.from) return 'Select date range';
    if (range.to)
      return `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}`;
    return format(range.from, 'MMM dd, yyyy');
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    onDateRangeChange(range);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-card p-4 rounded-lg border shadow-sm">
      {/* Date Range Picker - EXACT same as payments */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <CalendarIcon className="w-4 h-4" />
            {getDateRangeDisplayText(dateRange)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateRangeSelect}
            numberOfMonths={2}
            className="rounded-md border"
          />
        </PopoverContent>
      </Popover>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="requested">Requested</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex-1" />

      {/* Sort Button - EXACT same as payments */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() =>
          onSortOrderChange(sortOrder === 'newest' ? 'oldest' : 'newest')
        }
      >
        {sortOrder === 'newest' ? (
          <ArrowDown className="w-4 h-4" />
        ) : (
          <ArrowUp className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">
          {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
        </span>
      </Button>
    </div>
  );
}
