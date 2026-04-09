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

// Simplified filter bar
export default function FilterBar({
  dateRange,
  onDateRangeChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  sortOrder,
  onSortOrderChange,
}: {
  dateRange?: DateRange;
  onDateRangeChange: (range?: DateRange) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  sortOrder: 'newest' | 'oldest';
  onSortOrderChange: (value: 'newest' | 'oldest') => void;
}) {
  const getDateRangeText = (range?: DateRange) => {
    if (!range?.from) return 'Date range';
    if (!range.to) return format(range.from, 'MMM dd, yyyy');
    return `${format(range.from, 'MMM dd')} - ${format(range.to, 'MMM dd, yyyy')}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2 bg-card p-3 rounded-lg border">
      {/* Date filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="w-4 h-4" />
            {getDateRangeText(dateRange)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>

      {/* Status filter */}
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>

      {/* Type filter */}
      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="wallet-topup">Wallet Top-up</SelectItem>
          <SelectItem value="payment">Payment</SelectItem>
          <SelectItem value="refund">Refund</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex-1" />

      {/* Sort order */}
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
        {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
      </Button>
    </div>
  );
}
