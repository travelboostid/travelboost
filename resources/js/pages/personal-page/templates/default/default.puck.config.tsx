import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import type { Config } from '@puckeditor/core';
import { Plane } from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import type { BasePuckProps } from '../base/base.puck.config';
import { BasePuckConfig } from '../base/base.puck.config';
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
import { StepsComponentConfig, type StepsComponentProps } from './blocks/steps';
import type { TestimonialsComponentProps } from './blocks/testimonials';
import { TestimonialsComponentConfig } from './blocks/testimonials';

type DefaultThemePuckProps = {
  Hero1: Hero1ComponentProps;
  Hero2: Hero2ComponentProps;
  Features: FeaturesComponentProps;
  Steps: StepsComponentProps;
  Testimonials: TestimonialsComponentProps;
  Cta: CtaComponentProps;
  Faq: FaqComponentProps;
  Footer1: Footer1ComponentProps;
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
    Hero1: Hero1ComponentConfig,
    Hero2: Hero2ComponentConfig,
    Features: FeaturesComponentConfig,
    Steps: StepsComponentConfig,
    Testimonials: TestimonialsComponentConfig,
    Cta: CtaComponentConfig,
    Faq: FaqComponentConfig,
    Footer1: Footer1ComponentConfig,
  },
  root: {
    fields: {
      title: { type: 'text' },
      theme: {
        type: 'select',
        options: [
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
        ],
      },
    },
    defaultProps: {
      title: 'Travel',
      theme: 'light',
      content: [],
    },
    render: ({ children, title, theme }) => {
      console.log('TTTT', theme);
      return (
        <ThemeProvider forcedTheme={theme} attribute="class">
          <div
            className={`flex min-h-screen flex-col bg-linear-to-b from-background to-background ${theme}`}
          >
            {/* Navigation */}
            <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plane className="h-8 w-8 text-primary" />
                    <span className="text-2xl font-bold text-foreground">
                      {title}
                    </span>
                  </div>
                  <nav className="hidden items-center gap-8 md:flex">
                    <Link
                      href="#"
                      className="text-foreground transition hover:text-primary"
                    >
                      Destinations
                    </Link>
                    <Link
                      href="#"
                      className="text-foreground transition hover:text-primary"
                    >
                      Packages
                    </Link>
                    <Link
                      href="#"
                      className="text-foreground transition hover:text-primary"
                    >
                      Reviews
                    </Link>
                  </nav>
                  <div className="flex gap-2">
                    <Button variant="ghost">Sign In</Button>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Get Started
                    </Button>
                  </div>
                </div>
              </div>
            </header>
            {children}
          </div>
        </ThemeProvider>
      );
    },
  },
};

export default DefaultThemePuckConfig;
