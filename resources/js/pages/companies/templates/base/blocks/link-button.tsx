import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import type { ComponentConfig, Fields } from '@puckeditor/core';
import type { ButtonComponentProps } from './button';
import { ButtonComponentFields } from './button';

export type LinkButtonComponentProps = ButtonComponentProps & {
  href: string;
  target: '_self' | '_blank';
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
    label: 'Link Button',
    fields: LinkButtonComponenentFields,
    render: ({ label, size, type, variant, editMode, href }) =>
      editMode ? (
        <Button size={size} type="button" variant={variant}>
          {label}
        </Button>
      ) : (
        <Button asChild size={size} type={type} variant={variant}>
          <Link href={href}>{label}</Link>
        </Button>
      ),
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
