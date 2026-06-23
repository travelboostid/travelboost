import type { CustomField } from '@puckeditor/core';
import { FieldLabel } from '@puckeditor/core';
import type { LinkButtonComponentProps } from '../base/blocks/link-button';
import { LinkButtonComponenentFields } from '../base/blocks/link-button';
import ImagePicker from './image-picker';

export function imageField(label = 'Image'): CustomField<string> {
    return {
        type: 'custom',
        label,
        render: ({ field, name, onChange, value }) => (
            <FieldLabel label={field.label || label}>
                <ImagePicker
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                />
            </FieldLabel>
        ),
    };
}

export function heroImageField(label = 'Image'): CustomField<string> {
    return {
        type: 'custom',
        label,
        render: ({ field, name, onChange, value }) => (
            <FieldLabel label={field.label || label}>
                <ImagePicker
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    variant="large"
                />
            </FieldLabel>
        ),
    };
}

export function linkButtonActionsField(
    label = 'Actions',
    max = 5,
): {
    label: string;
    type: 'array';
    max: number;
    arrayFields: typeof LinkButtonComponenentFields;
    getItemSummary: (item: LinkButtonComponentProps) => string;
} {
    return {
        label,
        type: 'array',
        max,
        arrayFields: LinkButtonComponenentFields,
        getItemSummary: (item) => item.label || 'Button',
    };
}
