import type { ComponentConfig } from '@puckeditor/core';

export type StepsComponentProps = {
  header: string;
  description: string;
  steps: { title: string; description: string }[];
};

export const StepsComponentConfig: ComponentConfig<StepsComponentProps> = {
  label: 'Steps',
  fields: {
    header: { type: 'text', contentEditable: true },
    description: { type: 'richtext', contentEditable: true },
    steps: {
      type: 'array',
      max: 5,
      arrayFields: {
        title: { type: 'text', contentEditable: true },
        description: { type: 'text', contentEditable: true },
      },
    },
  },
  render: ({ header, description, steps }) => (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground">{header}</h2>
          <p className="text-lg text-muted-foreground">{description}</p>
        </div>
        <div className="grid gap-8 md:grid-cols-4">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
  defaultProps: {
    header: 'Why Choose Us',
    description: 'Everything you need for the perfect journey',
    steps: [
      {
        title: 'Choose Destination',
        description: 'Browse and select your dream location',
      },
      {
        title: 'Pick Dates',
        description: 'Select your preferred travel dates',
      },
      {
        title: 'Customize Package',
        description: 'Add activities and preferences',
      },
      {
        title: 'Book & Go',
        description: 'Complete booking and start exploring',
      },
    ],
  },
};
