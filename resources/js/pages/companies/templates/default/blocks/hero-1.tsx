import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import type { ComponentConfig } from '@puckeditor/core';
import { Plane } from 'lucide-react';
import type { LinkButtonComponentProps } from '../../base/blocks/link-button';
import { LinkButtonComponenentFields } from '../../base/blocks/link-button';

export type Hero1ComponentProps = {
  header: string;
  description: string;
  actions: LinkButtonComponentProps[];
  summaries: { title: string; subtitle?: string }[];
};

export const Hero1ComponentConfig: ComponentConfig<Hero1ComponentProps> = {
  label: 'Hero 1',
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
              <div className="flex gap-4 pt-4 w-full">
                {summaries.map((summary: any, i: number) => (
                  <div key={i}>
                    <p className="flex-1 text-3xl font-bold text-primary">
                      {summary.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {summary.subtitle}
                    </p>
                  </div>
                ))}
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
  },
};
