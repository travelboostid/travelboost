import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import type { Config } from '@puckeditor/core';
import { ArrowRight, Plane } from 'lucide-react';
import type { BasePuckProps } from '../base/base.puck.config';
import { BasePuckConfig } from '../base/base.puck.config';
import type { FeaturesComponentProps } from './blocks/features';
import { FeaturesComponentConfig } from './blocks/features';
import { HeroComponentConfig, type HeroComponentProps } from './blocks/hero';
import { StepsComponentConfig, type StepsComponentProps } from './blocks/steps';
import type { TestimonialsComponentProps } from './blocks/testimonials';
import { TestimonialsComponentConfig } from './blocks/testimonials';

type DefaultThemePuckProps = {
  Hero: HeroComponentProps;
  Features: FeaturesComponentProps;
  Steps: StepsComponentProps;
  Testimonials: TestimonialsComponentProps;
} & BasePuckProps;

const DefaultThemePuckConfig: Config<DefaultThemePuckProps> = {
  components: {
    ...BasePuckConfig.components,
    Hero: HeroComponentConfig,
    Features: FeaturesComponentConfig,
    Steps: StepsComponentConfig,
    Testimonials: TestimonialsComponentConfig,
  },
  root: {
    defaultProps: {
      title: 'Travel',
      content: [],
    },
    render: ({ children, title }) => {
      return (
        <div className="flex min-h-screen flex-col bg-linear-to-b from-background to-background">
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

          {/* Promo Section */}
          <section className="bg-gradient-to-r from-primary/5 to-secondary/5 px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="grid gap-8 md:grid-cols-3">
                {[
                  { value: '30%', label: 'Summer Discount' },
                  { value: '100%', label: 'Satisfaction Guarantee' },
                  { value: '0%', label: 'Hidden Fees' },
                ].map((promo, i) => (
                  <Card key={i} className="bg-white/50 p-8 text-center">
                    <p className="mb-2 text-4xl font-bold text-primary">
                      {promo.value}
                    </p>
                    <p className="font-medium text-foreground">{promo.label}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-primary px-4 py-20 text-primary-foreground sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl space-y-6 text-center">
              <h2 className="text-4xl font-bold md:text-5xl">
                Ready for Your Adventure?
              </h2>
              <p className="text-lg opacity-90">
                Join thousands of travelers exploring the world with TravelSync
              </p>
              <Button size="lg" variant="secondary">
                Start Your Journey Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-foreground px-4 py-12 text-primary-foreground sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8 grid gap-8 md:grid-cols-4">
                <div>
                  <h4 className="mb-4 font-semibold">TravelSync</h4>
                  <p className="text-sm opacity-75">
                    Your gateway to unforgettable adventures
                  </p>
                </div>
                {['Company', 'Resources', 'Legal'].map((col, i) => (
                  <div key={i}>
                    <h4 className="mb-4 font-semibold">{col}</h4>
                    <ul className="space-y-2 text-sm opacity-75">
                      <li>
                        <Link href="#" className="hover:opacity-100">
                          Link One
                        </Link>
                      </li>
                      <li>
                        <Link href="#" className="hover:opacity-100">
                          Link Two
                        </Link>
                      </li>
                    </ul>
                  </div>
                ))}
              </div>
              <div className="border-t border-primary-foreground/20 pt-8 text-center text-sm opacity-75">
                <p>&copy; 2025 TravelSync. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      );
    },
  },
};

export default DefaultThemePuckConfig;
