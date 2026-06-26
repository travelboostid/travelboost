import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const indexPath = path.join(
    root,
    'resources/js/pages/companies/dashboard/bookings/index.tsx',
);
const typesPath = path.join(
    root,
    'resources/js/pages/companies/dashboard/bookings/booking-index-types.ts',
);
const receiptPath = path.join(
    root,
    'resources/js/pages/companies/dashboard/bookings/components/booking-index-receipt-dialog.tsx',
);
const rowActionsPath = path.join(
    root,
    'resources/js/pages/companies/dashboard/bookings/components/booking-index-row-actions.tsx',
);

const lines = fs.readFileSync(indexPath, 'utf8').split(/\r?\n/);

const typesStart = lines.findIndex((l) => l.startsWith('type FollowupPayload'));
const typesEnd = lines.findIndex((l) => l.startsWith('const STATUS_TAB_VALUES'));
const typeBlock = lines.slice(typesStart, typesEnd);
fs.writeFileSync(
    typesPath,
    `// Shared types for the dashboard bookings index page.\n\n${typeBlock.join('\n')}\n\nexport type { BookingResource, DocumentDetail, PaymentDetail, PaymentReviewItem, FollowupPayload, FollowupSummary };\n`,
);

const receiptStart = lines.findIndex((l) => l.startsWith('function ReceiptDialog'));
const receiptEnd = lines.findIndex(
    (l, i) => i > receiptStart && l.startsWith('// Page'),
);
const receiptBlock = lines
    .slice(receiptStart, receiptEnd)
    .map((l) => l.replace(/^function ReceiptDialog/, 'export function BookingIndexReceiptDialog'))
    .join('\n');
fs.writeFileSync(
    receiptPath,
    `import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatIDR } from '@/constants/booking';
import dayjs from 'dayjs';
import { FormattedMessage, useIntl, type IntlShape } from 'react-intl';
import type { PaymentDetail } from '../booking-index-types';

function receiptPaymentTime(payment: PaymentDetail): string {
    if (!payment.payment_date) {
        return '—';
    }

    return dayjs(payment.payment_date).format(
        payment.receipt?.type === 'online'
            ? 'DD MMM YYYY HH:mm:ss'
            : 'DD MMM YYYY',
    );
}

function receiptRowsForPayment(
    payment: PaymentDetail,
    intl: IntlShape,
): string[][] {
    if (!payment.receipt) {
        return [];
    }

    return [
        [
            intl.formatMessage({ defaultMessage: 'Type' }),
            payment.receipt.type.toUpperCase(),
        ],
        [
            intl.formatMessage({ defaultMessage: 'Method' }),
            payment.method_label,
        ],
        [
            intl.formatMessage({ defaultMessage: 'Receiver' }),
            payment.receiver_label,
        ],
        [
            intl.formatMessage({ defaultMessage: 'Amount' }),
            formatIDR(payment.amount),
        ],
        [
            intl.formatMessage({ defaultMessage: 'Payment Time' }),
            receiptPaymentTime(payment),
        ],
    ];
}

${receiptBlock}
`,
);

const docsStart = lines.findIndex((l) => l.startsWith('function DocumentsDialog'));
const rowEnd = lines.findIndex(
    (l, i) => i > docsStart && l === '// ---------------------------------------------------------------------------' && lines[i + 1]?.includes('Column factory'),
);
const rowBlock = lines
    .slice(docsStart, rowEnd)
    .map((l) =>
        l.replace(/^function RowActions/, 'export function BookingIndexRowActions'),
    )
    .join('\n');

fs.writeFileSync(
    rowActionsPath,
    `import BookingSchedulePicker, {
    type RescheduleScheduleOption,
} from '@/components/booking/booking-schedule-picker';
import {
    ManualPaymentDialog,
    type ManualPaymentData,
} from '@/components/booking/ManualPaymentDialog';
import { PaymentMethodDialog } from '@/components/payment/payment-method-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { formatIDR } from '@/constants/booking';
import { openOnlinePayment } from '@/lib/open-online-payment';
import { hasOnlinePaymentInstructions } from '@/lib/payment-instructions';
import { cn } from '@/lib/utils';
import { CorrectionChangeSummary } from '@/pages/companies/dashboard/bookings/components/booking-correction/correction-change-summary';
import ReschedulePriceAdjustmentField from '@/pages/companies/dashboard/bookings/components/booking-correction/reschedule-price-adjustment-field';
import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import dayjs from 'dayjs';
import {
    CalendarClockIcon,
    ChevronDown,
    CircleSlashIcon,
    Clock3Icon,
    CreditCardIcon,
    EditIcon,
    EyeIcon,
    FileTextIcon,
    HistoryIcon,
    MoreHorizontal,
    RotateCcwIcon,
    Undo2Icon,
} from 'lucide-react';
import * as React from 'react';
import { FormattedMessage, useIntl, type IntlShape } from 'react-intl';
import type {
    BookingResource,
    DocumentDetail,
    PaymentDetail,
    PaymentReviewItem,
} from '../booking-index-types';
import { BookingIndexReceiptDialog } from './booking-index-receipt-dialog';

${rowBlock.replace(/<ReceiptDialog/g, '<BookingIndexReceiptDialog').replace(/ReceiptDialog>/g, 'BookingIndexReceiptDialog>')}
`,
);

console.log('Extracted types, receipt dialog, and row actions.');
