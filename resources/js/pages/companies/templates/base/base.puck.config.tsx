import type { Config } from '@puckeditor/core';
import {
  withLayoutComponentConfig,
  type WithLayoutComponentProps,
} from './blocks/base';
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
  Input: WithLayoutComponentProps<InputComponentProps>;
  Button: WithLayoutComponentProps<ButtonComponentProps>;
  LinkButton: WithLayoutComponentProps<LinkButtonComponentProps>;
  Grid: WithLayoutComponentProps<GridComponentProps>;
  Flex: WithLayoutComponentProps<FlexComponentProps>;
  Link: WithLayoutComponentProps<LinkComponentProps>;
};

export const BasePuckConfig: Config<BasePuckProps> = {
  components: {
    PlainText: withLayoutComponentConfig(PlainTextComponentConfig),
    Input: withLayoutComponentConfig(InputComponentConfig),
    Button: withLayoutComponentConfig(ButtonComponentConfig),
    LinkButton: withLayoutComponentConfig(LinkButtonComponentConfig),
    Grid: withLayoutComponentConfig(GridComponentConfig),
    Flex: withLayoutComponentConfig(FlexComponentConfig),
    Link: withLayoutComponentConfig(LinkComponentConfig),
  },
};

type c = typeof BasePuckConfig.components.Button;
