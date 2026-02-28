import { Card } from '@/components/ui/card';
import type { ComponentConfig } from '@puckeditor/core';
import { LUCIDE_ICON_NAMES, LucideIconRenderer } from '../utils';

export type FeaturesComponentProps = {
  header: string;
  description: string;
  features: { icon: string; title: string; description: string }[];
};

export const FeaturesComponentConfig: ComponentConfig<FeaturesComponentProps> =
  {
    label: 'Features',
    fields: {
      header: { type: 'text', contentEditable: true },
      description: { type: 'richtext', contentEditable: true },
      features: {
        type: 'array',
        arrayFields: {
          icon: {
            type: 'select',
            options: LUCIDE_ICON_NAMES.map((name) => ({
              label: name,
              value: name,
            })),
            label: 'Icon',
          },
          title: { type: 'text', contentEditable: true },
          description: { type: 'text', contentEditable: true },
        },
      },
    },
    render: ({ header, description, features }) => (
      <section className="bg-card px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-foreground">
              {header}
            </h2>
            <p className="text-lg text-muted-foreground">{description}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, i) => (
              <Card key={i} className="p-6 transition hover:shadow-lg">
                <LucideIconRenderer
                  name={feature.icon}
                  className="mb-4 h-12 w-12 text-primary"
                />
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    ),
    defaultProps: {
      header: 'Why Choose Us',
      description: 'Everything you need for the perfect journey',
      features: [
        {
          icon: 'MapPin',
          title: 'Exotic Destinations',
          description: 'Handpicked locations from around the globe',
        },
        {
          icon: 'Users',
          title: 'Expert Guides',
          description: 'Professional guides with years of experience',
        },
        {
          icon: 'Clock',
          title: 'Flexible Schedules',
          description: 'Tours that fit your availability',
        },
        {
          icon: 'Shield',
          title: '100% Safe',
          description: 'Travel insurance included in all packages',
        },
        {
          icon: 'CreditCard',
          title: 'Easy Payment',
          description: 'Multiple payment options and plans',
        },
        {
          icon: 'Plane',
          title: '24/7 Support',
          description: 'Assistance whenever you need it',
        },
      ],
    },
  };
