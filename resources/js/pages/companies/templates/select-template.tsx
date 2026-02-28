import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import greenie from './bootstraps/greenie.json';
import simple from './bootstraps/simple.json';
import warm from './bootstraps/warm.json';
const TEMPLATES = [
  {
    name: 'Simple',
    description:
      'Minimal and structured design. Ideal for showcasing destinations and essential trip details clearly.',
    image:
      'https://cdn.shadcnstudio.com/ss-assets/components/card/image-2.png?height=280&format=auto',
    data: simple,
  },
  {
    name: 'Warm',
    description:
      'Inviting tones and immersive sections. Perfect for personal journeys, culture, and local experiences.',
    image:
      'https://cdn.shadcnstudio.com/ss-assets/components/card/image-2.png?height=280&format=auto',
    data: warm,
  },
  {
    name: 'Greenie',
    description:
      'Fresh and nature-driven style. Best for eco-travel, outdoor adventures, and sustainable trips.',
    image:
      'https://cdn.shadcnstudio.com/ss-assets/components/card/image-2.png?height=280&format=auto',
    data: greenie,
  },
  {
    name: 'Blank',
    description:
      'Start with a clean layout and build your page from the ground up.',
    image:
      'https://cdn.shadcnstudio.com/ss-assets/components/card/image-2.png?height=280&format=auto',
    data: {},
  },
];

const TemplateCard = ({
  template,
  onSelected,
}: {
  template: any;
  onSelected: (data: any) => void;
}) => {
  return (
    <Card className="flex pt-0">
      <CardContent className="px-0">
        <img
          src={template.image}
          alt="Banner"
          className="aspect-video h-70 rounded-t-xl object-cover"
        />
      </CardContent>
      <CardHeader className="flex-1">
        <CardTitle>{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button className="w-full" onClick={() => onSelected(template.data)}>
          Select
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function SelectTemplate({
  onSelected,
}: {
  onSelected: (data: any) => void;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Header */}
        <div className="text-center space-y-4 mb-14">
          <h1 className="text-4xl font-bold tracking-tight">
            Choose Your Travel Template
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start building your travel landing page. Pick a design that matches
            your destination style and brand personality.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TEMPLATES.map((t) => (
            <TemplateCard key={t.name} template={t} onSelected={onSelected} />
          ))}
        </div>
      </div>
    </div>
  );
}
