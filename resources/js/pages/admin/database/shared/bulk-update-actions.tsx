'use client';

import { ActionBarItem } from '@/components/ui/action-bar';
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
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export type BulkStatusOption = {
    label: string;
    value: string;
};

export type BulkStatusPayload = {
    status: string;
    note: string;
};

type BulkUpdateMenuProps = {
    options: BulkStatusOption[];
    disabled?: boolean;
    onSelect: (status: string) => void;
};

export function BulkUpdateMenu({
    options,
    disabled = false,
    onSelect,
}: BulkUpdateMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={disabled}>
                <ActionBarItem
                    onSelect={(event) => {
                        event.preventDefault();
                    }}
                >
                    <ChevronDown />
                    Status
                </ActionBarItem>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        className="capitalize"
                        onClick={() => onSelect(option.value)}
                    >
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

type BulkStatusWithNoteDialogProps = {
    disabled?: boolean;
    selectedCount: number;
    entityLabel: string;
    statusOptions: BulkStatusOption[];
    showNote?: boolean;
    onSubmit: (payload: BulkStatusPayload) => void;
};

export function BulkStatusWithNoteDialog({
    disabled = false,
    selectedCount,
    entityLabel,
    statusOptions,
    showNote = true,
    onSubmit,
}: BulkStatusWithNoteDialogProps) {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState('');
    const [note, setNote] = useState('');

    const resetForm = () => {
        setStatus('');
        setNote('');
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            resetForm();
        }
    };

    const handleSubmit = () => {
        if (!status) {
            return;
        }

        onSubmit({ status, note });
        resetForm();
        setOpen(false);
    };

    return (
        <>
            <ActionBarItem
                disabled={disabled}
                onSelect={(event) => {
                    event.preventDefault();
                    setOpen(true);
                }}
            >
                <CheckCircle2 />
                Status+
            </ActionBarItem>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Status+</DialogTitle>
                        <DialogDescription>
                            Set a new status for {selectedCount} selected{' '}
                            {entityLabel}
                            {selectedCount === 1 ? '' : 's'}.
                            {showNote
                                ? ' Optionally add a note explaining the change.'
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bulk-status">Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger id="bulk-status">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                            className="capitalize"
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {showNote ? (
                            <div className="space-y-2">
                                <Label htmlFor="bulk-status-note">Note</Label>
                                <Textarea
                                    id="bulk-status-note"
                                    rows={4}
                                    value={note}
                                    onChange={(event) =>
                                        setNote(event.target.value)
                                    }
                                    placeholder="Reason for this status change (optional)."
                                />
                            </div>
                        ) : null}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!status}
                        >
                            Apply
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
