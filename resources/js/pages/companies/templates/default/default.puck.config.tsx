import type { Config } from '@puckeditor/core';
import type { BasePuckProps } from '../base/base.puck.config';
import { BasePuckConfig } from '../base/base.puck.config';
import type { WithLayoutComponentProps } from '../base/blocks/base';
import { withLayoutComponentConfig } from '../base/blocks/base';
import { Card1ComponentConfig, type Card1ComponentProps } from './blocks/card1';
import { CtaComponentConfig, type CtaComponentProps } from './blocks/cta';
import type { FaqComponentProps } from './blocks/faq';
import { FaqComponentConfig } from './blocks/faq';
import type { FeaturesComponentProps } from './blocks/features';
import { FeaturesComponentConfig } from './blocks/features';
import type { Footer1ComponentProps } from './blocks/footer-1';
import { Footer1ComponentConfig } from './blocks/footer-1';
import {
  Hero1ComponentConfig,
  type Hero1ComponentProps,
} from './blocks/hero-1';
import {
  Hero2ComponentConfig,
  type Hero2ComponentProps,
} from './blocks/hero-2';
import type { Hero3ComponentProps } from './blocks/hero-3';
import { Hero3ComponentConfig } from './blocks/hero-3';
import { StepsComponentConfig, type StepsComponentProps } from './blocks/steps';
import type { TestimonialsComponentProps } from './blocks/testimonials';
import { TestimonialsComponentConfig } from './blocks/testimonials';
import DefaultLayout from './default-layout';

type DefaultThemePuckProps = {
  Hero1: WithLayoutComponentProps<Hero1ComponentProps>;
  Hero2: WithLayoutComponentProps<Hero2ComponentProps>;
  Hero3: WithLayoutComponentProps<Hero3ComponentProps>;
  Features: WithLayoutComponentProps<FeaturesComponentProps>;
  Steps: WithLayoutComponentProps<StepsComponentProps>;
  Testimonials: WithLayoutComponentProps<TestimonialsComponentProps>;
  Cta: WithLayoutComponentProps<CtaComponentProps>;
  Faq: WithLayoutComponentProps<FaqComponentProps>;
  Footer1: WithLayoutComponentProps<Footer1ComponentProps>;
  Card1: WithLayoutComponentProps<Card1ComponentProps>;
} & BasePuckProps;

const DefaultThemePuckConfig: Config<DefaultThemePuckProps> = {
  categories: {
    layout: {
      title: 'Layout',
      components: ['Grid', 'Flex'],
    },
    basic: {
      title: 'Basic',
      components: ['PlainText', 'Input', 'Button', 'LinkButton', 'Link'],
    },
    blocks: {
      title: 'Block Components',
      components: [
        'Hero1',
        'Hero2',
        'Hero3',
        'Card1',
        'Features',
        'Steps',
        'Testimonials',
        'Cta',
        'Faq',
        'Footer1',
      ],
    },
  },
  components: {
    ...BasePuckConfig.components,
    Hero1: withLayoutComponentConfig(Hero1ComponentConfig as any) as any,
    Hero2: withLayoutComponentConfig(Hero2ComponentConfig as any) as any,
    Hero3: withLayoutComponentConfig(Hero3ComponentConfig as any) as any,
    Features: withLayoutComponentConfig(FeaturesComponentConfig as any) as any,
    Steps: withLayoutComponentConfig(StepsComponentConfig as any) as any,
    Testimonials: withLayoutComponentConfig(
      TestimonialsComponentConfig as any,
    ) as any,
    Cta: withLayoutComponentConfig(CtaComponentConfig as any) as any,
    Faq: withLayoutComponentConfig(FaqComponentConfig as any) as any,
    Footer1: withLayoutComponentConfig(Footer1ComponentConfig as any) as any,
    Card1: withLayoutComponentConfig(Card1ComponentConfig as any) as any,
  },
  root: {
    fields: {
      title: { type: 'text' },
      theme: {
        type: 'select',
        options: [
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
          { label: 'Greenie', value: 'greenie' },
          { label: 'Calmie', value: 'calmie' },
          { label: 'Warmie', value: 'warmie' },
          { label: 'Greenie Dark', value: 'dark greenie' },
          { label: 'Calmie Dark', value: 'dark calmie' },
          { label: 'Warmie Dark', value: 'dark warmie' },
        ],
      },
    },
    defaultProps: {
      title: 'Travel',
      theme: 'light',
      content: [],
    },
    render: (props) => {
      return <DefaultLayout {...props} />;
    },
  },
};

export default DefaultThemePuckConfig;
