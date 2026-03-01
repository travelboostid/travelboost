import type { Company, TourResource } from '@/api/model';
import { useFloatingChatWidgetContext } from '@/components/chat/state';
import TenantLayout from '@/components/layouts/tenant-layout';
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
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { extractImageSrc } from '@/lib/utils';
import { IconPdf } from '@tabler/icons-react';
import { MessageSquareIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { EmptyTours } from './empty-tours';

export type AgentTour = {
  id: number;
  company_id: number;
  company: Company;
  tour: TourResource;
};

function TourCard({ agentTour }: { agentTour: AgentTour }) {
  const floatingChat = useFloatingChatWidgetContext();
  const [startingPrivateChat, setStartingPrivateChat] = useState(false);
  const hasDocument = Boolean(agentTour.tour.document);
  const { src, srcSet } = extractImageSrc(agentTour.tour.image as any);

  const handleMessage = async () => {
    try {
      setStartingPrivateChat(true);
      floatingChat.setAttachment({ type: 'agent-tour', data: agentTour });
      await floatingChat.startPrivateChat({
        type: 'company',
        id: agentTour.company_id,
      });
    } finally {
      setStartingPrivateChat(false);
    }
  };

  return (
    <Card className="relative mx-auto w-full overflow-hidden pt-0">
      <img
        src={src}
        srcSet={srcSet}
        alt="Event cover"
        className="relative z-20 aspect-video w-full object-cover"
      />
      <CardHeader>
        <CardTitle>{agentTour.tour.name}</CardTitle>
        <CardDescription>{agentTour.tour.description}</CardDescription>
      </CardHeader>
      <CardFooter className="flex gap-2">
        <Button variant="secondary" className="flex-1" disabled={!hasDocument}>
          <IconPdf />
          <span className="hidden md:inline">Brochures</span>
        </Button>
        <Button
          onClick={handleMessage}
          disabled={startingPrivateChat}
          variant="secondary"
          className="flex-1"
        >
          {startingPrivateChat ? <Spinner /> : <MessageSquareIcon />}
        </Button>
      </CardFooter>
    </Card>
  );
}

type ArticlePageProps = {
  data: AgentTour[];
};

export default function Page({ data }: ArticlePageProps) {
  return (
    <TenantLayout>
      {data.length ? (
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
            {data.map((tour) => (
              <TourCard agentTour={tour} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyTours />
      )}
    </TenantLayout>
  );
}
