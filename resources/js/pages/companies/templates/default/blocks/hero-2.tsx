import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { FieldLabel, type ComponentConfig } from '@puckeditor/core';
import { Plane } from 'lucide-react';
import type { LinkButtonComponentProps } from '../../base/blocks/link-button';
import { LinkButtonComponenentFields } from '../../base/blocks/link-button';
import ImagePicker from '../../components/image-picker';
import { LUCIDE_ICON_NAMES, LucideIconRenderer } from '../utils';

export type Hero2ComponentProps = {
  imageUrl: string;
  header: string;
  description: string;
  actions: LinkButtonComponentProps[];
  features: { icon: string; content: string }[];
};

export const Hero2ComponentConfig: ComponentConfig<Hero2ComponentProps> = {
  label: 'Hero 2',
  fields: {
    imageUrl: {
      label: 'Image',
      type: 'custom',
      render: ({ field, name, onChange, value }) => (
        <FieldLabel label={field.label || 'Image'}>
          <ImagePicker name={name} value={value} onChange={onChange} />
        </FieldLabel>
      ),
    },
    header: { label: 'Header', type: 'richtext', contentEditable: true },
    description: {
      label: 'Description',
      type: 'richtext',
      contentEditable: true,
    },
    actions: {
      label: 'Actions',
      type: 'array',
      max: 5,
      arrayFields: LinkButtonComponenentFields as any,
      getItemSummary: (item) => item.label || 'Button',
    },
    features: {
      label: 'Features',
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
      getItemSummary: (item) => item.content || 'Item',
    },
  },
  defaultProps: {
    imageUrl: '',
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
  render: ({ imageUrl, header, description, actions, features, editMode }) => {
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
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Hero Image"
                className="w-full aspect-video rounded-2xl object-cover shadow"
              />
            ) : (
              <div className="relative flex h-96 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-primary/10 to-secondary/10 md:h-full">
                <div className="text-center">
                  <Plane className="mx-auto mb-4 h-24 w-24 text-primary/30" />
                  <p className="text-muted-foreground">Adventure awaits</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  },
};
