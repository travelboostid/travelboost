import type { Config } from '@puckeditor/core';
import type { BasePuckProps } from '../base/base.puck.config';
import { BasePuckConfig } from '../base/base.puck.config';
import type { WithLayoutComponentProps } from '../base/blocks/base';
import { withLayoutComponentConfig } from '../base/blocks/base';
import {
    AboutUsComponentConfig,
    type AboutUsComponentProps,
} from './blocks/about-us';
import {
    BlogCardsComponentConfig,
    type BlogCardsComponentProps,
} from './blocks/blog-cards';
import { Card1ComponentConfig, type Card1ComponentProps } from './blocks/card1';
import {
    ComparisonComponentConfig,
    type ComparisonComponentProps,
} from './blocks/comparison';
import {
    ContactSectionComponentConfig,
    type ContactSectionComponentProps,
} from './blocks/contact-section';
import { CtaComponentConfig, type CtaComponentProps } from './blocks/cta';
import { Cta2ComponentConfig, type Cta2ComponentProps } from './blocks/cta-2';
import { Cta3ComponentConfig, type Cta3ComponentProps } from './blocks/cta-3';
import { Cta4ComponentConfig, type Cta4ComponentProps } from './blocks/cta-4';
import {
    DestinationsComponentConfig,
    type DestinationsComponentProps,
} from './blocks/destinations';
import type { FaqComponentProps } from './blocks/faq';
import { FaqComponentConfig } from './blocks/faq';
import type { FeaturesComponentProps } from './blocks/features';
import { FeaturesComponentConfig } from './blocks/features';
import {
    Features2ComponentConfig,
    type Features2ComponentProps,
} from './blocks/features-2';
import {
    Features3ComponentConfig,
    type Features3ComponentProps,
} from './blocks/features-3';
import {
    Features4ComponentConfig,
    type Features4ComponentProps,
} from './blocks/features-4';
import type { Footer1ComponentProps } from './blocks/footer-1';
import { Footer1ComponentConfig } from './blocks/footer-1';
import type { Footer2ComponentProps } from './blocks/footer-2';
import { Footer2ComponentConfig } from './blocks/footer-2';
import type { Footer3ComponentProps } from './blocks/footer-3';
import { Footer3ComponentConfig } from './blocks/footer-3';
import type { GalleryComponentProps } from './blocks/gallery';
import { GalleryComponentConfig } from './blocks/gallery';
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
import type { Hero4ComponentProps } from './blocks/hero-4';
import { Hero4ComponentConfig } from './blocks/hero-4';
import type { Hero5ComponentProps } from './blocks/hero-5';
import { Hero5ComponentConfig } from './blocks/hero-5';
import type { Hero6ComponentProps } from './blocks/hero-6';
import { Hero6ComponentConfig } from './blocks/hero-6';
import type { LogoCloudComponentProps } from './blocks/logo-cloud';
import { LogoCloudComponentConfig } from './blocks/logo-cloud';
import type { PricingComponentProps } from './blocks/pricing';
import { PricingComponentConfig } from './blocks/pricing';
import {
    QuoteBlockComponentConfig,
    type QuoteBlockComponentProps,
} from './blocks/quote-block';
import {
    SplitContentComponentConfig,
    type SplitContentComponentProps,
} from './blocks/split-content';
import type { StatsComponentProps } from './blocks/stats';
import { StatsComponentConfig } from './blocks/stats';
import { StepsComponentConfig, type StepsComponentProps } from './blocks/steps';
import { TeamComponentConfig, type TeamComponentProps } from './blocks/team';
import type { TestimonialsComponentProps } from './blocks/testimonials';
import { TestimonialsComponentConfig } from './blocks/testimonials';
import {
    TimelineComponentConfig,
    type TimelineComponentProps,
} from './blocks/timeline';
import {
    VideoSectionComponentConfig,
    type VideoSectionComponentProps,
} from './blocks/video-section';
import DefaultLayout from './default-layout';

type DefaultThemePuckProps = {
    AboutUs: WithLayoutComponentProps<AboutUsComponentProps>;
    Hero1: WithLayoutComponentProps<Hero1ComponentProps>;
    Hero2: WithLayoutComponentProps<Hero2ComponentProps>;
    Hero3: WithLayoutComponentProps<Hero3ComponentProps>;
    Hero4: WithLayoutComponentProps<Hero4ComponentProps>;
    Hero5: WithLayoutComponentProps<Hero5ComponentProps>;
    Hero6: WithLayoutComponentProps<Hero6ComponentProps>;
    Features: WithLayoutComponentProps<FeaturesComponentProps>;
    Features2: WithLayoutComponentProps<Features2ComponentProps>;
    Features3: WithLayoutComponentProps<Features3ComponentProps>;
    Features4: WithLayoutComponentProps<Features4ComponentProps>;
    Steps: WithLayoutComponentProps<StepsComponentProps>;
    Testimonials: WithLayoutComponentProps<TestimonialsComponentProps>;
    Cta: WithLayoutComponentProps<CtaComponentProps>;
    Cta2: WithLayoutComponentProps<Cta2ComponentProps>;
    Cta3: WithLayoutComponentProps<Cta3ComponentProps>;
    Cta4: WithLayoutComponentProps<Cta4ComponentProps>;
    Faq: WithLayoutComponentProps<FaqComponentProps>;
    Footer1: WithLayoutComponentProps<Footer1ComponentProps>;
    Footer2: WithLayoutComponentProps<Footer2ComponentProps>;
    Footer3: WithLayoutComponentProps<Footer3ComponentProps>;
    Card1: WithLayoutComponentProps<Card1ComponentProps>;
    Stats: WithLayoutComponentProps<StatsComponentProps>;
    Gallery: WithLayoutComponentProps<GalleryComponentProps>;
    Pricing: WithLayoutComponentProps<PricingComponentProps>;
    LogoCloud: WithLayoutComponentProps<LogoCloudComponentProps>;
    Destinations: WithLayoutComponentProps<DestinationsComponentProps>;
    SplitContent: WithLayoutComponentProps<SplitContentComponentProps>;
    Timeline: WithLayoutComponentProps<TimelineComponentProps>;
    Team: WithLayoutComponentProps<TeamComponentProps>;
    BlogCards: WithLayoutComponentProps<BlogCardsComponentProps>;
    ContactSection: WithLayoutComponentProps<ContactSectionComponentProps>;
    Comparison: WithLayoutComponentProps<ComparisonComponentProps>;
    QuoteBlock: WithLayoutComponentProps<QuoteBlockComponentProps>;
    VideoSection: WithLayoutComponentProps<VideoSectionComponentProps>;
} & BasePuckProps;

const DefaultThemePuckConfig = {
    categories: {
        heroes: {
            title: '🎯 Heroes',
            defaultExpanded: true,
            components: ['Hero1', 'Hero2', 'Hero3', 'Hero4', 'Hero5', 'Hero6'],
        },
        features: {
            title: '✨ Features',
            components: ['Features', 'Features2', 'Features3', 'Features4'],
        },
        content: {
            title: '📄 Content',
            components: [
                'Destinations',
                'SplitContent',
                'Steps',
                'Timeline',
                'Team',
                'BlogCards',
                'ContactSection',
                'Comparison',
                'QuoteBlock',
                'AboutUs',
                'Card1',
                'Gallery',
            ],
        },
        socialProof: {
            title: '⭐ Social Proof',
            components: ['Stats', 'Testimonials', 'LogoCloud'],
        },
        conversion: {
            title: '🚀 Call to Action',
            components: ['Cta', 'Cta2', 'Cta3', 'Cta4', 'Pricing', 'Faq'],
        },
        typography: {
            title: '✏️ Typography',
            components: ['PlainText', 'Heading'],
        },
        media: {
            title: '🖼️ Media',
            components: ['Image', 'VideoSection', 'Gallery'],
        },
        actions: {
            title: '🔘 Actions & Forms',
            components: ['Button', 'LinkButton', 'Link', 'Input'],
        },
        layout: {
            title: '📐 Layout',
            components: ['Grid', 'Flex', 'Spacer', 'Divider'],
        },
        footer: {
            title: '📎 Footers',
            components: ['Footer1', 'Footer2', 'Footer3'],
        },
    },
    components: {
        ...BasePuckConfig.components,
        AboutUs: withLayoutComponentConfig(AboutUsComponentConfig),
        Hero1: withLayoutComponentConfig(Hero1ComponentConfig),
        Hero2: withLayoutComponentConfig(Hero2ComponentConfig),
        Hero3: withLayoutComponentConfig(Hero3ComponentConfig),
        Hero4: withLayoutComponentConfig(Hero4ComponentConfig),
        Hero5: withLayoutComponentConfig(Hero5ComponentConfig),
        Hero6: withLayoutComponentConfig(Hero6ComponentConfig),
        Features: withLayoutComponentConfig(FeaturesComponentConfig),
        Features2: withLayoutComponentConfig(Features2ComponentConfig),
        Features3: withLayoutComponentConfig(Features3ComponentConfig),
        Features4: withLayoutComponentConfig(Features4ComponentConfig),
        Steps: withLayoutComponentConfig(StepsComponentConfig),
        Testimonials: withLayoutComponentConfig(TestimonialsComponentConfig),
        Cta: withLayoutComponentConfig(CtaComponentConfig),
        Cta2: withLayoutComponentConfig(Cta2ComponentConfig),
        Cta3: withLayoutComponentConfig(Cta3ComponentConfig),
        Cta4: withLayoutComponentConfig(Cta4ComponentConfig),
        Faq: withLayoutComponentConfig(FaqComponentConfig),
        Footer1: withLayoutComponentConfig(Footer1ComponentConfig),
        Footer2: withLayoutComponentConfig(Footer2ComponentConfig),
        Footer3: withLayoutComponentConfig(Footer3ComponentConfig),
        Card1: withLayoutComponentConfig(Card1ComponentConfig),
        Stats: withLayoutComponentConfig(StatsComponentConfig),
        Gallery: withLayoutComponentConfig(GalleryComponentConfig),
        Pricing: withLayoutComponentConfig(PricingComponentConfig),
        LogoCloud: withLayoutComponentConfig(LogoCloudComponentConfig),
        Destinations: withLayoutComponentConfig(DestinationsComponentConfig),
        SplitContent: withLayoutComponentConfig(SplitContentComponentConfig),
        Timeline: withLayoutComponentConfig(TimelineComponentConfig),
        Team: withLayoutComponentConfig(TeamComponentConfig),
        BlogCards: withLayoutComponentConfig(BlogCardsComponentConfig),
        ContactSection: withLayoutComponentConfig(
            ContactSectionComponentConfig,
        ),
        Comparison: withLayoutComponentConfig(ComparisonComponentConfig),
        QuoteBlock: withLayoutComponentConfig(QuoteBlockComponentConfig),
        VideoSection: withLayoutComponentConfig(VideoSectionComponentConfig),
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
} as Config<DefaultThemePuckProps>;

export default DefaultThemePuckConfig;
