import StdLayout from '@/components/layouts/std-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  IconBrandFacebookFilled,
  IconBrandInstagramFilled,
  IconBrandTiktokFilled,
  IconPdf,
} from '@tabler/icons-react';
import { SearchIcon } from 'lucide-react';
import { EmptyTours } from './empty-tours';

export type Tour = {
  id: number;
  code: string;
  name: string;
  description: string;
  durationDays: number;
  status: string;
  continent: string;
  region: string;
  country: string;
  destination: string;
  category_id: number;
  user_id: number;
};

function TourCard({ tour }: { tour: Tour }) {
  return (
    <Card className="relative mx-auto w-full overflow-hidden pt-0">
      <img
        src={`https://picsum.photos/id/${tour.id * 10}/200/300`}
        alt="Event cover"
        className="relative z-20 aspect-video w-full object-cover"
      />
      <CardHeader>
        <CardTitle>{tour.name}</CardTitle>
        <CardDescription>{tour.description}</CardDescription>
      </CardHeader>
      <CardFooter className="flex gap-2">
        <Button variant="secondary" className="flex-1">
          <IconPdf />
          View PDF
        </Button>
        <Button>
          <IconBrandFacebookFilled />
        </Button>
        <Button>
          <IconBrandInstagramFilled />
        </Button>
        <Button>
          <IconBrandTiktokFilled />
        </Button>
      </CardFooter>
    </Card>
  );
}

type ArticlePageProps = {
  data: {
    data: Tour[];
  };
};

export default function Page({ data }: ArticlePageProps) {
  return (
    <StdLayout>
      {data.data.length ? (
        <div className="space-y-4 p-4">
          <div className="justify-items-center">
            <ToggleGroup variant="outline" type="single" defaultValue="all">
              <ToggleGroupItem value="all" aria-label="Toggle all">
                All
              </ToggleGroupItem>
              <ToggleGroupItem value="missed" aria-label="Toggle missed">
                Missed
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="justify-items-center">
            <InputGroup className="max-w-xs">
              <InputGroupInput placeholder="Search..." />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {data.data.map((tour) => (
              <TourCard tour={tour} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyTours />
      )}
    </StdLayout>
  );
}
