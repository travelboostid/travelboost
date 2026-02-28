import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import type { ComponentConfig } from '@puckeditor/core';
import type { LinkButtonComponentProps } from '../../base/blocks/link-button';
import { LinkButtonComponenentFields } from '../../base/blocks/link-button';

export type Hero3ComponentProps = {
  header: string;
  description: string;
  actions: LinkButtonComponentProps[];
  summaries: { title: string; subtitle?: string }[];
};

export const Hero3ComponentConfig: ComponentConfig<Hero3ComponentProps> = {
  label: 'Hero 3',
  fields: {
    header: { type: 'richtext', contentEditable: true },
    description: { type: 'richtext', contentEditable: true },
    actions: {
      type: 'array',
      max: 5,
      arrayFields: LinkButtonComponenentFields as any,
    },
    summaries: {
      type: 'array',
      max: 5,
      arrayFields: {
        title: { type: 'text', contentEditable: true },
        subtitle: { type: 'text', contentEditable: true },
      },
    },
  },
  defaultProps: {
    header: 'Explore the World Your Way',
    description:
      'Discover extraordinary destinations with personalized travel packages curated by expert guides. Your adventure starts here.',
    actions: [
      {
        variant: 'default',
        label: 'Browse Destinations',
        size: 'default',
        disabled: false,
        className: '',
        type: 'button',
        href: '/tours',
        target: '_self',
      },
      {
        variant: 'secondary',
        label: 'Learn More',
        size: 'default',
        disabled: false,
        className: '',
        type: 'button',
        href: '/tours',
        target: '_self',
      },
    ],
    summaries: [
      { title: '500+', subtitle: 'Destinations' },
      { title: '50k+', subtitle: 'Happy Travelers' },
      { title: '24/7', subtitle: 'Support' },
    ],
  },
  render: ({ header, description, actions, summaries, editMode }) => {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-linear-to-b from-muted/30 to-background">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/stunning-tropical-beach-paradise.jpg"
            alt="Paradise destination"
            className="w-full h-full object-cover opacity-20"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center py-32">
          <div className="space-y-8">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-light tracking-tight text-balance text-foreground">
              {header}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              {description}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              {actions.map(({ label, target, href, ...buttonProps }, i) =>
                editMode ? (
                  <Button key={i} {...buttonProps}>
                    {label}
                  </Button>
                ) : (
                  <Button key={i} {...buttonProps}>
                    <Link href={href} target={target}>
                      {label}
                    </Link>
                  </Button>
                ),
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 md:gap-16 max-w-3xl mx-auto mt-24 pt-16 border-t border-border/50">
            {summaries.map((summary: any, i: number) => (
              <div className="space-y-2" key={i}>
                <div className="text-4xl md:text-5xl font-bold text-foreground">
                  {summary.title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {summary.subtitle}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  },
};
