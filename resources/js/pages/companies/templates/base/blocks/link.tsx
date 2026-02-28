import { Link } from '@inertiajs/react';
import type { ComponentConfig, Fields, Slot } from '@puckeditor/core';

export type LinkComponentProps = {
  href: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  target: string;
  className: string;
  content: Slot;
};

export const LinkComponentFields: Fields<LinkComponentProps> = {
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
  content: {
    type: 'slot',
    label: 'Link Content',
  },
};

export const LinkComponentConfig: ComponentConfig<LinkComponentProps> = {
  fields: LinkComponentFields,
  defaultProps: {
    href: '#',
    method: 'get',
    target: '_self',
    className: '',
    content: [
      {
        type: 'PlainText',
        props: { text: 'Link' },
      },
    ],
  },
  render: ({ content: SlotComp, href, editMode }) => (
    <Link href={editMode ? '' : href}>
      <SlotComp />
    </Link>
  ),
};
