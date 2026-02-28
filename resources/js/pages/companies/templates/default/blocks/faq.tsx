import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { ComponentConfig } from '@puckeditor/core';

export type FaqComponentProps = {
  title: string;
  description: string;
  items: {
    question: string;
    answer: string;
  }[];
};

export const FaqComponentConfig: ComponentConfig<FaqComponentProps> = {
  label: 'FAQ',
  fields: {
    title: { type: 'text', contentEditable: true },
    description: { type: 'text', contentEditable: true },
    items: {
      type: 'array',
      max: 10,
      arrayFields: {
        question: { type: 'text', contentEditable: true },
        answer: { type: 'text', contentEditable: true },
      },
    },
  },
  defaultProps: {
    title: "Need Help? We've Got Answers",
    description:
      'Explore Our Most Commonly Asked Questions and Find the Information You Need.',
    items: [
      {
        question: 'Do you charge for each upgrade?',
        answer:
          'Some upgrades are free, while others may have an additional cost, depending on the type of upgrade and your current plan. For specific pricing details, please check our pricing page or contact our support team.',
      },
      {
        question: 'Do I need to purchase a license for each website?',
        answer:
          'Yes, you need to purchase a separate license for each website where you plan to use our components. Each license is tied to a single domain and its subdomains. This ensures proper licensing compliance and helps us maintain and improve our products for all users.',
      },
      {
        question: 'What is regular license?',
        answer:
          'A regular license grants you the right to use our components on a single website or project. It includes access to all basic features, documentation, and standard support. This license is perfect for individual developers or small businesses working on a single project.',
      },
    ],
  },
  render: ({ title, description, items }) => {
    return (
      <section className="py-8 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* FAQ Header */}
          <div className="mb-12 space-y-4 text-center sm:mb-16 lg:mb-24">
            <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">
              {title}
            </h2>
            <p className="text-muted-foreground text-xl">{description}</p>
          </div>

          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="item-1"
          >
            {items.map((item, index) => (
              <AccordionItem key={index} value={`item-${index + 1}`}>
                <AccordionTrigger className="text-lg">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    );
  },
};
