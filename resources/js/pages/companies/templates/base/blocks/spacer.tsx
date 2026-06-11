import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';

export type SpacerComponentProps = {
    size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
    customHeight: number;
    showGuide: boolean;
};

const sizeClasses: Record<
    Exclude<SpacerComponentProps['size'], 'custom'>,
    string
> = {
    xs: 'h-4',
    sm: 'h-8',
    md: 'h-16',
    lg: 'h-24',
    xl: 'h-32',
    '2xl': 'h-48',
};

export const SpacerComponentConfig: ComponentConfig<SpacerComponentProps> = {
    label: 'Spacer',
    fields: {
        size: {
            type: 'select',
            label: 'Preset Size',
            options: [
                { value: 'xs', label: 'Extra Small (16px)' },
                { value: 'sm', label: 'Small (32px)' },
                { value: 'md', label: 'Medium (64px)' },
                { value: 'lg', label: 'Large (96px)' },
                { value: 'xl', label: 'Extra Large (128px)' },
                { value: '2xl', label: '2XL (192px)' },
                { value: 'custom', label: 'Custom Height' },
            ],
        },
        customHeight: {
            type: 'number',
            label: 'Custom Height (px)',
            min: 0,
            max: 400,
        },
        showGuide: {
            type: 'radio',
            label: 'Show Guide in Editor',
            options: [
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
            ],
        },
    },
    defaultProps: {
        size: 'md',
        customHeight: 80,
        showGuide: true,
    },
    resolveFields: (data, params) => {
        const { fields } = params;

        if (data.props.size !== 'custom') {
            const { customHeight: _, ...rest } = fields;

            return rest as typeof fields;
        }

        return fields;
    },
    render: ({ size, customHeight, showGuide, editMode }) => (
        <div
            aria-hidden
            className={cn(
                size === 'custom' ? undefined : sizeClasses[size],
                editMode &&
                    showGuide &&
                    'rounded border border-dashed border-primary/30 bg-primary/5',
            )}
            style={
                size === 'custom' ? { height: `${customHeight}px` } : undefined
            }
        />
    ),
};
