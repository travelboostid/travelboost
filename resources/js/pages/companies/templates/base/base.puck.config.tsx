import type { Config } from '@puckeditor/core';
import {
    withLayoutComponentConfig,
    type WithLayoutComponentProps,
} from './blocks/base';
import type { ButtonComponentProps } from './blocks/button';
import { ButtonComponentConfig } from './blocks/button';
import type { DividerComponentProps } from './blocks/divider';
import { DividerComponentConfig } from './blocks/divider';
import type { FlexComponentProps } from './blocks/flex';
import { FlexComponentConfig } from './blocks/flex';
import type { GridComponentProps } from './blocks/grid';
import { GridComponentConfig } from './blocks/grid';
import type { HeadingComponentProps } from './blocks/heading';
import { HeadingComponentConfig } from './blocks/heading';
import type { ImageComponentProps } from './blocks/image';
import { ImageComponentConfig } from './blocks/image';
import { InputComponentConfig, type InputComponentProps } from './blocks/input';
import type { LinkComponentProps } from './blocks/link';
import { LinkComponentConfig } from './blocks/link';
import {
    LinkButtonComponentConfig,
    type LinkButtonComponentProps,
} from './blocks/link-button';
import type { PlainTextProps } from './blocks/plain-text';
import { PlainTextComponentConfig } from './blocks/plain-text';
import type { SpacerComponentProps } from './blocks/spacer';
import { SpacerComponentConfig } from './blocks/spacer';

export type BasePuckProps = {
    PlainText: WithLayoutComponentProps<PlainTextProps>;
    Heading: WithLayoutComponentProps<HeadingComponentProps>;
    Image: WithLayoutComponentProps<ImageComponentProps>;
    Spacer: WithLayoutComponentProps<SpacerComponentProps>;
    Divider: WithLayoutComponentProps<DividerComponentProps>;
    Input: WithLayoutComponentProps<InputComponentProps>;
    Button: WithLayoutComponentProps<ButtonComponentProps>;
    LinkButton: WithLayoutComponentProps<LinkButtonComponentProps>;
    Grid: WithLayoutComponentProps<GridComponentProps>;
    Flex: WithLayoutComponentProps<FlexComponentProps>;
    Link: WithLayoutComponentProps<LinkComponentProps>;
};

export const BasePuckConfig = {
    components: {
        PlainText: withLayoutComponentConfig(PlainTextComponentConfig),
        Heading: withLayoutComponentConfig(HeadingComponentConfig),
        Image: withLayoutComponentConfig(ImageComponentConfig),
        Spacer: withLayoutComponentConfig(SpacerComponentConfig),
        Divider: withLayoutComponentConfig(DividerComponentConfig),
        Input: withLayoutComponentConfig(InputComponentConfig),
        Button: withLayoutComponentConfig(ButtonComponentConfig),
        LinkButton: withLayoutComponentConfig(LinkButtonComponentConfig),
        Grid: withLayoutComponentConfig(GridComponentConfig),
        Flex: withLayoutComponentConfig(FlexComponentConfig),
        Link: withLayoutComponentConfig(LinkComponentConfig),
    },
} as Config<BasePuckProps>;
