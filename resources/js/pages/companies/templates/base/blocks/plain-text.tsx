import type { ComponentConfig } from '@puckeditor/core';
import { Fragment } from 'react/jsx-runtime';

export type PlainTextProps = {
  text: string;
};

export const PlainTextComponentConfig: ComponentConfig<PlainTextProps> = {
  fields: {
    text: { type: 'text', contentEditable: true },
  },
  render: ({ text }) => <Fragment>{text}</Fragment>,
  defaultProps: {
    text: 'Text',
  },
};
