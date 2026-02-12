import { Link } from '@inertiajs/react';
import type { ComponentConfig, Slot } from '@puckeditor/core';

export type LinkComponentProps = {
  href: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  target: string;
  className: string;
  children: Slot;
};

export const LinkComponentConfig: ComponentConfig<LinkComponentProps> = {
  fields: {
    href: {
      type: 'text',
      label: 'URL',
    },
    method: {
      type: 'select',
      label: 'HTTP Method',
      options: [
        { value: 'get', label: 'GET' },
        { value: 'post', label: 'POST' },
        { value: 'put', label: 'PUT' },
        { value: 'delete', label: 'DELETE' },
      ],
    },
    target: {
      type: 'select',
      label: 'Target',
      options: [
        { value: '_self', label: 'Same Tab' },
        { value: '_blank', label: 'New Tab' },
      ],
    },
    className: {
      type: 'text',
      label: 'CSS Classes',
    },
    children: {
      type: 'slot',
      label: 'Link Content',
    },
  },
  render: ({ children: SlotComp, ...props }) => (
    <Link {...props}>
      <SlotComp />
    </Link>
  ),
  defaultProps: {
    href: '#',
    method: 'get',
    target: '_self',
    className: '',
    children: [
      {
        type: 'PlainText',
        props: { text: 'Link' },
      },
    ],
  },
};
