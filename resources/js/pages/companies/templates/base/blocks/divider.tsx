import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';

export type DividerComponentProps = {
    spacing: 'sm' | 'md' | 'lg';
    variant: 'default' | 'muted' | 'primary' | 'gradient';
    style: 'line' | 'label' | 'dots';
    label: string;
    width: 'full' | 'half' | 'third';
};

const spacingClasses: Record<DividerComponentProps['spacing'], string> = {
    sm: 'my-4',
    md: 'my-8',
    lg: 'my-16',
};

const variantClasses: Record<DividerComponentProps['variant'], string> = {
    default: 'bg-border',
    muted: 'bg-muted-foreground/30',
    primary: 'bg-primary/40',
    gradient: 'bg-linear-to-r from-transparent via-primary/50 to-transparent',
};

const widthClasses: Record<DividerComponentProps['width'], string> = {
    full: 'w-full',
    half: 'mx-auto w-1/2',
    third: 'mx-auto w-1/3',
};

export const DividerComponentConfig: ComponentConfig<DividerComponentProps> = {
    label: 'Divider',
    fields: {
        style: {
            type: 'select',
            label: 'Style',
            options: [
                { value: 'line', label: 'Simple Line' },
                { value: 'label', label: 'Line with Label' },
                { value: 'dots', label: 'Dots' },
            ],
        },
        label: {
            type: 'text',
            label: 'Label Text',
            contentEditable: true,
        },
        spacing: {
            type: 'select',
            label: 'Vertical Spacing',
            options: [
                { value: 'sm', label: 'Small' },
                { value: 'md', label: 'Medium' },
                { value: 'lg', label: 'Large' },
            ],
        },
        variant: {
            type: 'select',
            label: 'Color',
            options: [
                { value: 'default', label: 'Default' },
                { value: 'muted', label: 'Muted' },
                { value: 'primary', label: 'Primary' },
                { value: 'gradient', label: 'Gradient' },
            ],
        },
        width: {
            type: 'select',
            label: 'Width',
            options: [
                { value: 'full', label: 'Full Width' },
                { value: 'half', label: 'Half Width' },
                { value: 'third', label: 'Third Width' },
            ],
        },
    },
    defaultProps: {
        spacing: 'md',
        variant: 'default',
        style: 'line',
        label: 'Section',
        width: 'full',
    },
    resolveFields: (data, params) => {
        const { fields } = params;

        if (data.props.style !== 'label') {
            const { label: _, ...rest } = fields;

            return rest as typeof fields;
        }

        return fields;
    },
    render: ({ spacing, variant, style, label, width }) => {
        if (style === 'dots') {
            return (
                <div
                    className={cn(
                        'flex justify-center gap-2',
                        spacingClasses[spacing],
                    )}
                >
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className={cn(
                                'size-1.5 rounded-full',
                                variant === 'primary'
                                    ? 'bg-primary'
                                    : 'bg-muted-foreground/40',
                            )}
                        />
                    ))}
                </div>
            );
        }

        if (style === 'label' && label) {
            return (
                <div
                    className={cn(
                        'flex items-center gap-4',
                        spacingClasses[spacing],
                        widthClasses[width],
                    )}
                >
                    <Separator
                        className={cn('flex-1', variantClasses[variant])}
                    />
                    <span className="shrink-0 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                        {label}
                    </span>
                    <Separator
                        className={cn('flex-1', variantClasses[variant])}
                    />
                </div>
            );
        }

        return (
            <Separator
                className={cn(
                    spacingClasses[spacing],
                    variantClasses[variant],
                    widthClasses[width],
                )}
            />
        );
    },
};
