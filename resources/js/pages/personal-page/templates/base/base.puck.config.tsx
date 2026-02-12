import type { Config } from '@puckeditor/core';
import type { ButtonComponentProps } from './blocks/button';
import { ButtonComponentConfig } from './blocks/button';
import { InputComponentConfig, type InputComponentProps } from './blocks/input';
import type { LinkComponentProps } from './blocks/link';
import { LinkComponentConfig } from './blocks/link';
import type { PlainTextProps } from './blocks/plain-text';
import { PlainTextComponentConfig } from './blocks/plain-text';

export type BasePuckProps = {
  PlainText: PlainTextProps;
  Input: InputComponentProps;
  Button: ButtonComponentProps;
  Link: LinkComponentProps;
};

export const BasePuckConfig: Config<BasePuckProps> = {
  components: {
    PlainText: PlainTextComponentConfig,
    Input: InputComponentConfig,
    Button: ButtonComponentConfig,
    Link: LinkComponentConfig,
  },
};
