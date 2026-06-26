import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import * as React from 'react';
import { useIntl } from 'react-intl';

function BookingIndexPaxCellComponent({
    adult,
    child,
    infant,
}: {
    adult: number;
    child: number;
    infant: number;
}) {
    const intl = useIntl();
    const total = adult + child + infant;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                    {total}
                </span>
            </TooltipTrigger>
            <TooltipContent>
                <p>
                    {intl.formatMessage(
                        {
                            defaultMessage:
                                '{adult} Adult · {child} Child · {infant} Infant',
                        },
                        { adult, child, infant },
                    )}
                </p>
            </TooltipContent>
        </Tooltip>
    );
}

export const BookingIndexPaxCell = React.memo(BookingIndexPaxCellComponent);
