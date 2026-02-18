import type { Config } from '@puckeditor/core';
import type { ButtonComponentProps } from './blocks/button';
import { ButtonComponentConfig } from './blocks/button';
import type { FlexComponentProps } from './blocks/flex';
import { FlexComponentConfig } from './blocks/flex';
import type { GridComponentProps } from './blocks/grid';
import { GridComponentConfig } from './blocks/grid';
import { InputComponentConfig, type InputComponentProps } from './blocks/input';
import type { LinkComponentProps } from './blocks/link';
import { LinkComponentConfig } from './blocks/link';
import {
  LinkButtonComponentConfig,
  type LinkButtonComponentProps,
} from './blocks/link-button';
import type { PlainTextProps } from './blocks/plain-text';
import { PlainTextComponentConfig } from './blocks/plain-text';

export type BasePuckProps = {
  PlainText: PlainTextProps;
  Input: InputComponentProps;
  Button: ButtonComponentProps;
  LinkButton: LinkButtonComponentProps;
  Grid: GridComponentProps;
  Flex: FlexComponentProps;
  Link: LinkComponentProps;
};

export const BasePuckConfig: Config<BasePuckProps> = {
  components: {
    PlainText: PlainTextComponentConfig,
    Input: InputComponentConfig,
    Button: ButtonComponentConfig,
    LinkButton: LinkButtonComponentConfig,
    Grid: GridComponentConfig,
    Flex: FlexComponentConfig,
    Link: LinkComponentConfig,
  },
};
