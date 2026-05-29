import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/constants/booking';
import {
    FileTextIcon,
    Loader2Icon,
    UploadCloudIcon,
    XIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';

export type ManualPaymentData = {
    senderBankName: string;
    senderAccountNumber: string;
    paymentDate: string;
    transferAmount: number;
    proofFile: File | null;
};

const todayInputValue = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000,
)
    .toISOString()
    .slice(0, 10);

type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: ManualPaymentData) => void;
    isSubmitting: boolean;
    vendorBank: {
        bankName: string;
        accountName: string;
        accountNumber: string;
    };
    amount: number;
};

export function ManualPaymentDialog({
    open,
    onClose,
    onSubmit,
    isSubmitting,
    vendorBank,
    amount,
}: Props) {
    const [form, setForm] = useState<ManualPaymentData>({
        senderBankName: '',
        senderAccountNumber: '',
        paymentDate: todayInputValue,
        transferAmount: amount,
        proofFile: null,
    });
    const fileRef = useRef<HTMLInputElement>(null);

    const update = <K extends keyof ManualPaymentData>(
        key: K,
        value: ManualPaymentData[K],
    ) => setForm((current) => ({ ...current, [key]: value }));

    const canSubmit =
        form.senderBankName.trim() !== '' &&
        form.senderAccountNumber.trim() !== '' &&
        form.paymentDate.trim() !== '' &&
        /^\d+$/.test(form.senderAccountNumber) &&
        amount > 0 &&
        form.proofFile !== null;

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <DialogContent className="w-full max-w-md">
                <DialogHeader>
                    <DialogTitle>Manual Bank Transfer</DialogTitle>
                </DialogHeader>

                <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Transfer To
                    </p>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Bank</span>
                            <span className="font-semibold">
                                {vendorBank.bankName || '—'}
                            </span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                                Account Name
                            </span>
                            <span className="text-right font-semibold">
                                {vendorBank.accountName || '—'}
                            </span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                                Account Number
                            </span>
                            <span className="font-mono font-semibold tracking-wider">
                                {vendorBank.accountNumber || '—'}
                            </span>
                        </div>
                        <div className="flex justify-between gap-4 border-t pt-2">
                            <span className="text-muted-foreground">
                                Pay Now
                            </span>
                            <span className="font-semibold text-primary">
                                {formatCurrency(amount)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="grid gap-1">
                        <Label>Your Bank Name</Label>
                        <Input
                            placeholder="e.g. BCA"
                            value={form.senderBankName}
                            onChange={(event) =>
                                update('senderBankName', event.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label>Your Account Number</Label>
                        <Input
                            placeholder="e.g. 1234567890"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={form.senderAccountNumber}
                            onChange={(event) =>
                                update(
                                    'senderAccountNumber',
                                    event.target.value.replace(/\D/g, ''),
                                )
                            }
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label>Transfer Amount</Label>
                        <Input
                            type="number"
                            min={1}
                            value={amount}
                            disabled
                            readOnly
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label>Payment Date</Label>
                        <Input
                            type="date"
                            max={todayInputValue}
                            value={form.paymentDate}
                            onChange={(event) =>
                                update('paymentDate', event.target.value)
                            }
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label>Payment Receipt</Label>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(event) =>
                                update(
                                    'proofFile',
                                    event.target.files?.[0] ?? null,
                                )
                            }
                        />
                        {form.proofFile ? (
                            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                                <FileTextIcon className="size-4 shrink-0 text-primary" />
                                <span className="flex-1 truncate text-xs text-foreground">
                                    {form.proofFile.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        update('proofFile', null);
                                        if (fileRef.current) {
                                            fileRef.current.value = '';
                                        }
                                    }}
                                    className="shrink-0 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <XIcon className="size-3.5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                            >
                                <UploadCloudIcon className="size-3.5" />
                                Upload file
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() =>
                            onSubmit({ ...form, transferAmount: amount })
                        }
                        disabled={!canSubmit || isSubmitting}
                    >
                        {isSubmitting && (
                            <Loader2Icon className="size-4 animate-spin" />
                        )}
                        {isSubmitting ? 'Submitting...' : 'Submit Payment'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
