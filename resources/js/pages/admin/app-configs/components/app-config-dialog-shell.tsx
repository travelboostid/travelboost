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
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    configKey?: string;
    trigger?: ReactNode;
    children: ReactNode;
    onSubmit: () => void;
    submitLabel: string;
    processing?: boolean;
    wide?: boolean;
};

export function AppConfigDialogShell({
    open,
    onOpenChange,
    title,
    description,
    configKey,
    trigger,
    children,
    onSubmit,
    submitLabel,
    processing = false,
    wide = false,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger}
            <DialogContent
                className={cn(
                    'flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0',
                    wide ? 'sm:max-w-3xl' : 'sm:max-w-2xl',
                )}
            >
                <DialogHeader className="space-y-3 border-b px-6 py-5">
                    <div className="flex flex-wrap items-center gap-2 pr-6">
                        <DialogTitle>{title}</DialogTitle>
                        {configKey ? (
                            <Badge
                                variant="outline"
                                className="font-mono text-xs font-normal"
                            >
                                {configKey}
                            </Badge>
                        ) : null}
                    </div>
                    {description ? (
                        <DialogDescription>{description}</DialogDescription>
                    ) : null}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {children}
                </div>

                <DialogFooter className="border-t px-6 py-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onSubmit}
                        disabled={processing}
                    >
                        {processing ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        {submitLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
