import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { ComponentConfig } from '@puckeditor/core';
import { UserIcon } from 'lucide-react';

export type TestimonialsComponentProps = {
  badge: string;
  header: string;
  description: string;
  testimonials: any[];
};

export function Testimonials({
  testimonials,
  badge,
  header,
  description,
}: TestimonialsComponentProps) {
  return (
    <section className="py-8 sm:py-16 lg:py-24">
      <Carousel
        className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-11 px-4 sm:px-6 md:grid-cols-2 lg:px-8"
        opts={{
          align: 'start',
          slidesToScroll: 1,
        }}
      >
        {/* Left Content */}
        <div className="space-y-4 md:space-y-16">
          <div className="space-y-4">
            <Badge variant="outline" className="text-sm font-normal">
              {badge}
            </Badge>
            <h2 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">
              {header}
            </h2>
            <p className="text-muted-foreground text-xl">{description}</p>
          </div>

          <div className="flex items-center gap-5">
            <CarouselPrevious
              variant="default"
              className="disabled:bg-primary/10 disabled:text-primary static size-9 translate-y-0 disabled:opacity-100"
            />
            <CarouselNext
              variant="default"
              className="disabled:bg-primary/10 disabled:text-primary static size-9 translate-y-0 disabled:opacity-100"
            />
          </div>
        </div>

        {/* Right Testimonial Carousel */}
        <div className="relative">
          <CarouselContent className="sm:-ml-6">
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="sm:pl-6">
                <div className="flex flex-col gap-10">
                  <div className="space-y-2">
                    <p className="h-14 text-8xl">&ldquo;</p>
                    <p className="text-muted-foreground text-xl font-medium sm:text-2xl lg:text-3xl">
                      {testimonial.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-12 rounded-full">
                      <AvatarImage
                        src={testimonial.avatar}
                        alt={testimonial.name}
                      />
                      <AvatarFallback className="rounded-full text-sm">
                        <UserIcon />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h4 className="text-lg font-medium">
                        {testimonial.name}
                      </h4>
                      <p className="text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </div>
      </Carousel>
    </section>
  );
}

export const TestimonialsComponentConfig: ComponentConfig<TestimonialsComponentProps> =
  {
    fields: {
      badge: { type: 'text', contentEditable: true },
      header: { type: 'text', contentEditable: true },
      description: { type: 'richtext', contentEditable: true },
      testimonials: {
        type: 'array',
        max: 5,
        arrayFields: {
          name: { type: 'text', contentEditable: true },
          roleAndCompany: { type: 'text', contentEditable: true },
        },
      },
    },
    render: ({ badge, header, description, testimonials }) => (
      <Testimonials
        badge={badge}
        header={header}
        description={description}
        testimonials={testimonials as any}
      />
    ),
    defaultProps: {
      badge: 'Testimonials',
      header: 'Trusted by leaders from various industries',
      description:
        "From career changes to dream jobs, here's how Shadcn Studio helped.",
      testimonials: [
        {
          name: 'Craig Bator',
          role: 'CEO & Co Founder at Zendesk',
          avatar:
            'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png?width=40&height=40&format=auto',
          content:
            "I've been using shadcn/studio for a year now and it's made managing my finances so much easier and quick.",
        },
        {
          name: 'Martin Dorwart',
          role: 'Product manager at Orbit',
          avatar:
            'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-2.png?width=40&height=40&format=auto',
          content:
            "With shadcn/studio, I can easily track my investments and see how they're performing in real-time.",
        },
        {
          name: 'Sarah Johnson',
          role: 'Lead Designer at Figma',
          avatar:
            'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png?width=40&height=40&format=auto',
          content:
            "The UI components are beautifully designed and incredibly easy to customize. It's transformed our design workflow.",
        },
      ],
    },
  };
