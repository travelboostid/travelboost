import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ComponentConfig } from '@puckeditor/core';
import { ButtonComponentFields } from '../../base/blocks/button';
import type { LinkButtonComponentProps } from '../../base/blocks/link-button';

export type Card1ComponentProps = {
  image: string;
  title: string;
  description: string;
  actions: LinkButtonComponentProps[];
};

export const Card1ComponentConfig: ComponentConfig<Card1ComponentProps> = {
  label: 'Card 1',

  fields: {
    image: {
      type: 'text',
      label: 'Image URL',
    },
    title: {
      type: 'text',
      label: 'Title',
      contentEditable: true,
    },
    description: {
      type: 'textarea',
      label: 'Description',
      contentEditable: true,
    },
    actions: {
      type: 'array',
      max: 2,
      arrayFields: ButtonComponentFields as any,
    },
  },

  defaultProps: {
    image:
      'https://cdn.shadcnstudio.com/ss-assets/components/card/image-7.png?width=368&format=auto',
    title: 'Mystical Blue Swirl',
    description:
      'Dive into the depths of an enchanting swirl where vibrant blues and soft pinks merge seamlessly.',
    actions: [
      {
        variant: 'default',
        label: 'Explore More',
        size: 'default',
        disabled: false,
        className: '',
        type: 'button',
        href: '/tours',
        target: '_self',
      },
      {
        variant: 'outline',
        label: 'Download Now',
        size: 'default',
        disabled: false,
        className: '',
        type: 'button',
        href: '/tours',
        target: '_self',
      },
    ],
  },

  render: ({ image, title, description, actions }) => {
    return (
      <Card className="overflow-hidden pt-0">
        <CardContent className="px-0">
          <img
            src={image}
            alt={title}
            className="aspect-video w-full object-cover"
          />
        </CardContent>

        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        {actions?.length > 0 && (
          <CardFooter className="gap-3 max-sm:flex-col max-sm:items-stretch">
            {actions.map((action: any, i: number) => (
              <Button
                key={i}
                variant={action.variant}
                size={action.size}
                disabled={action.disabled}
                className={action.className}
              >
                {action.label}
              </Button>
            ))}
          </CardFooter>
        )}
      </Card>
    );
  },
};
