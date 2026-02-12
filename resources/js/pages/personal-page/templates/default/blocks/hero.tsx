import { Button } from '@/components/ui/button';
import type { ComponentConfig } from '@puckeditor/core';
import { ArrowRight, Plane } from 'lucide-react';

export type HeroComponentProps = {
  header: string;
  description: string;
};

export function Hero({ header, description }: HeroComponentProps) {
  return (
    <section className="relative px-4 py-20 sm:px-6 md:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <h1 className="text-5xl leading-tight font-bold text-foreground md:text-6xl">
              {header}
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              {description}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Browse Destinations <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div>
                <p className="text-3xl font-bold text-primary">500+</p>
                <p className="text-sm text-muted-foreground">Destinations</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">50k+</p>
                <p className="text-sm text-muted-foreground">Happy Travelers</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">24/7</p>
                <p className="text-sm text-muted-foreground">Support</p>
              </div>
            </div>
          </div>
          <div className="relative flex h-96 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 md:h-full">
            <div className="text-center">
              <Plane className="mx-auto mb-4 h-24 w-24 text-primary/30" />
              <p className="text-muted-foreground">Adventure awaits</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export const HeroComponentConfig: ComponentConfig<HeroComponentProps> = {
  fields: {
    header: { type: 'text', contentEditable: true },
    description: { type: 'text', contentEditable: true },
  },
  render: ({ header, description }) => (
    <Hero header={header} description={description} />
  ),
  defaultProps: {
    header: 'Explore the World Your Way',
    description:
      'Discover extraordinary destinations with personalized travel packages curated by expert guides. Your adventure starts here.',
  },
};
