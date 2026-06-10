import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Props = {
    title: string;
    description?: string;
    step?: number;
    children: ReactNode;
    className?: string;
};

export function AppConfigFormSection({
    title,
    description,
    step,
    children,
    className,
}: Props) {
    return (
        <section className={cn('space-y-4', className)}>
            <div className="space-y-1">
                {step ? (
                    <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Step {step}
                    </p>
                ) : null}
                <h3 className="text-sm font-semibold text-foreground">
                    {title}
                </h3>
                {description ? (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
            {children}
        </section>
    );
}
