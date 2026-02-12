import type { ComponentConfig } from '@puckeditor/core';
import { Fragment } from 'react/jsx-runtime';

export type PlainTextProps = {
  text: string;
};

export function PlainText({ text }: PlainTextProps) {
  return <Fragment>{text}</Fragment>;
}

export const PlainTextComponentConfig: ComponentConfig<PlainTextProps> = {
  fields: {
    text: { type: 'text', contentEditable: true },
  },
  render: ({ text }) => <PlainText text={text} />,
  defaultProps: {
    text: 'Text',
  },
};
