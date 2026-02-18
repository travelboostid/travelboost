import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { withLayout } from '../../base/blocks/base';
import type { ButtonComponentProps } from '../../base/blocks/button';
import { ButtonComponentFields } from '../../base/blocks/button';
import { LUCIDE_ICON_NAMES, LucideIconRenderer } from '../utils';

export type Hero2ComponentProps = {
  header: string;
  description: string;
  actions: ButtonComponentProps[];
  features: { icon: string; content: string }[];
};

export const Hero2ComponentConfig = withLayout({
  label: 'Hero 2',
  fields: {
    header: { type: 'text', contentEditable: true },
    description: { type: 'text', contentEditable: true },
    actions: {
      type: 'array',
      max: 5,
      arrayFields: ButtonComponentFields as any,
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
      },
      {
        variant: 'outline',
        label: 'Learn More',
        size: 'default',
        disabled: false,
        className: '',
        type: 'button',
      },
    ],
    features: [
      { icon: 'Zap', content: 'Lorem ipsum dolor sit amet' },
      { icon: 'Zap', content: 'Lorem ipsum dolor sit amet' },
      { icon: 'Zap', content: 'Lorem ipsum dolor sit amet' },
    ],
  },
  render: ({ header, description, actions, features }) => {
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
                {actions.map((action: any, i: any) => (
                  <Button key={i} variant={action.variant}>
                    {action.label}
                  </Button>
                ))}
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
});
