import { Button } from '@/components/ui/button';
import type { ComponentConfig } from '@puckeditor/core';

export type ButtonComponentProps = {
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
  disabled: boolean;
  className: string;
  type: 'button' | 'submit' | 'reset';
};

export const ButtonComponentConfig: ComponentConfig<ButtonComponentProps> = {
  fields: {
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
      type: 'richtext',
      label: 'Label',
      contentEditable: true,
    },
    disabled: {
      type: 'select',
      label: 'Disabled',
      options: [
        { value: false, label: 'No' },
        { value: true, label: 'Yes' },
      ],
    },
    className: {
      type: 'text',
      label: 'CSS Classes',
    },
  },
  render: ({ label, ...props }) => <Button {...props}>{label}</Button>,
  defaultProps: {
    type: 'button',
    variant: 'default',
    size: 'default',
    label: 'Button',
    disabled: false,
    className: '',
  },
};
