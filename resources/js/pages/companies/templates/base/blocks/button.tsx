import { Button } from '@/components/ui/button';
import type {
  ComponentConfig,
  DefaultComponentProps,
  Fields,
} from '@puckeditor/core';

export type ButtonComponentProps = DefaultComponentProps & {
  variant:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | null;
  size:
    | 'default'
    | 'xs'
    | 'sm'
    | 'lg'
    | 'icon'
    | 'icon-xs'
    | 'icon-sm'
    | 'icon-lg';
  label: string;
  className: string;
  type: 'button' | 'submit' | 'reset';
};

export const ButtonComponentFields: Fields<ButtonComponentProps> = {
  variant: {
    type: 'select',
    label: 'Variant',
    options: [
      { value: 'default', label: 'Default' },
      { value: 'destructive', label: 'Destructive' },
      { value: 'outline', label: 'Outline' },
      { value: 'secondary', label: 'Secondary' },
      { value: 'ghost', label: 'Ghost' },
      { value: 'link', label: 'Link' },
    ],
  },
  type: {
    type: 'select',
    label: 'Type',
    options: [
      { value: 'button', label: 'Button' },
      { value: 'submit', label: 'Submit' },
      { value: 'reset', label: 'Reset' },
    ],
  },
  size: {
    type: 'select',
    label: 'Size',
    options: [
      { value: 'default', label: 'Default' },
      { value: 'sm', label: 'Small' },
      { value: 'lg', label: 'Large' },
      { value: 'icon', label: 'Icon' },
    ],
  },
  label: {
    type: 'text',
    label: 'Label',
    contentEditable: true,
  },
};

export const ButtonComponentConfig: ComponentConfig<ButtonComponentProps> = {
  fields: ButtonComponentFields,
  render: ({ label, size, type, variant, editMode }) =>
    editMode ? (
      <Button size={size} type="button" variant={variant}>
        {label}
      </Button>
    ) : (
      <Button size={size} type={type} variant={variant}>
        {label}
      </Button>
    ),
  defaultProps: {
    type: 'button',
    variant: 'default',
    size: 'default',
    label: 'Button',
    disabled: false,
    className: '',
  },
};
