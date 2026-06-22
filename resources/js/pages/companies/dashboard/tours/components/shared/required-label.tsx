import { Label } from '@/components/ui/label';
import type { ReactNode } from 'react';

type RequiredLabelProps = {
    children: ReactNode;
};

export function RequiredLabel({ children }: RequiredLabelProps) {
    return (
        <Label className="flex items-center gap-1.5">
            <span>{children}</span>
            <span className="text-rose-500">*</span>
        </Label>
    );
}
