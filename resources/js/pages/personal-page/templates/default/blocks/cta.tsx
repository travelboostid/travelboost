import { Button } from '@/components/ui/button';
import type { ComponentConfig } from '@puckeditor/core';
import type { ButtonComponentProps } from '../../base/blocks/button';
import { ButtonComponentFields } from '../../base/blocks/button';

export type CtaComponentProps = {
  header: string;
  description: string;
  actions: ButtonComponentProps[];
};

export const CtaComponentConfig: ComponentConfig<CtaComponentProps> = {
  label: 'CTA',
  fields: {
    header: { type: 'text', contentEditable: true },
    description: { type: 'text', contentEditable: true },
    actions: {
      type: 'array',
      max: 5,
      arrayFields: ButtonComponentFields as any,
    },
  },
  defaultProps: {
    header: 'Ready for Your Adventure?',
    description: 'Join thousands of travelers exploring the world with us',
    actions: [
      {
        variant: 'secondary',
        label: 'Start Your Journey Now',
        size: 'default',
        disabled: false,
        className: '',
        type: 'button',
      },
    ],
  },
  render: ({ header, description, actions }) => {
    return (
      <section className="bg-primary px-4 py-20 text-primary-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <h2 className="text-4xl font-bold md:text-5xl">{header}</h2>
          <p className="text-lg opacity-90">{description}</p>
          <div className="flex gap-2 justify-center">
            {actions.map((action, i) => (
              <Button key={i} variant={action.variant}>
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </section>
    );
  },
};
