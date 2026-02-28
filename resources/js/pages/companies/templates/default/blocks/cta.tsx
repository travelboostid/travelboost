import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import type { ComponentConfig } from '@puckeditor/core';
import type { LinkButtonComponentProps } from '../../base/blocks/link-button';
import { LinkButtonComponenentFields } from '../../base/blocks/link-button';

export type CtaComponentProps = {
  header: string;
  description: string;
  actions: LinkButtonComponentProps[];
};

export const CtaComponentConfig: ComponentConfig<CtaComponentProps> = {
  label: 'CTA',
  fields: {
    header: { type: 'text', contentEditable: true },
    description: { type: 'text', contentEditable: true },
    actions: {
      type: 'array',
      max: 5,
      arrayFields: LinkButtonComponenentFields as any,
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
        href: '/tours',
        target: '_self',
      },
    ],
  },
  render: ({ header, description, actions, editMode }) => {
    return (
      <section className="bg-primary px-4 py-20 text-primary-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <h2 className="text-4xl font-bold md:text-5xl">{header}</h2>
          <p className="text-lg opacity-90">{description}</p>
          <div className="flex gap-2 justify-center">
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
      </section>
    );
  },
};
