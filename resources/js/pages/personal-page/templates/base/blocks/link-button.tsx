import { Button } from '@/components/ui/button';
import type { ComponentConfig, Fields } from '@puckeditor/core';
import type { ButtonComponentProps } from './button';
import { ButtonComponentFields } from './button';

export type LinkButtonComponentProps = ButtonComponentProps & {
  href: string;
  target: string;
};

export const LinkButtonComponenentFields: Fields<LinkButtonComponentProps> = {
  ...ButtonComponentFields,
  href: {
    type: 'text',
    label: 'URL',
  },
  target: {
    type: 'select',
    label: 'Target',
    options: [
      { value: '_self', label: 'Same Tab' },
      { value: '_blank', label: 'New Tab' },
    ],
  },
};

export const LinkButtonComponentConfig: ComponentConfig<LinkButtonComponentProps> =
  {
    fields: LinkButtonComponenentFields,
    render: ({ label, ...props }) => <Button {...props}>{label}</Button>,
    defaultProps: {
      type: 'button',
      variant: 'default',
      size: 'default',
      label: 'Button',
      disabled: false,
      className: '',
      href: '#',
      target: '_self',
    },
  };
