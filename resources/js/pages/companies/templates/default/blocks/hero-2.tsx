import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import type { ComponentConfig } from '@puckeditor/core';
import { Sparkles } from 'lucide-react';
import type { LinkButtonComponentProps } from '../../base/blocks/link-button';
import { LinkButtonComponenentFields } from '../../base/blocks/link-button';
import { LUCIDE_ICON_NAMES, LucideIconRenderer } from '../utils';

export type Hero2ComponentProps = {
  header: string;
  description: string;
  actions: LinkButtonComponentProps[];
  features: { icon: string; content: string }[];
};

export const Hero2ComponentConfig: ComponentConfig<Hero2ComponentProps> = {
  label: 'Hero 2',
  fields: {
    header: { type: 'richtext', contentEditable: true },
    description: { type: 'richtext', contentEditable: true },
    actions: {
      type: 'array',
      max: 5,
      arrayFields: LinkButtonComponenentFields as any,
    },
    features: {
      type: 'array',
      max: 5,
      arrayFields: {
        icon: {
          type: 'select',
          options: LUCIDE_ICON_NAMES.map((name) => ({
            label: name,
            value: name,
          })),
          label: 'Icon',
        },
        content: { type: 'text', contentEditable: true },
      },
    },
  },
  defaultProps: {
    header: 'Powerful features built for scale',
    description:
      'Everything you need to build, deploy, and monitor production-grade applications. From instant deployments to edge functions.',
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
    features: [
      { icon: 'Zap', content: 'Lorem ipsum dolor sit amet' },
      { icon: 'Zap', content: 'Lorem ipsum dolor sit amet' },
      { icon: 'Zap', content: 'Lorem ipsum dolor sit amet' },
    ],
  },
  render: ({ header, description, actions, features, editMode }) => {
    return (
      <section className="w-full px-4 py-20 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
                {header}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 text-balance">
                {description}
              </p>
              <ul className="space-y-4 mb-10">
                {features.map((feature: any, i: any) => (
                  <li key={i} className="flex items-center gap-3">
                    <LucideIconRenderer
                      name={feature.icon}
                      className="w-5 h-5 shrink-0 text-primary"
                    />
                    <span className="text-base">{feature.content}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
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
            <div className="bg-linear-to-br from-primary/20 to-secondary/20 rounded-2xl h-96 flex items-center justify-center border border-primary/20">
              <div className="text-center">
                <Sparkles className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Feature Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  },
};
