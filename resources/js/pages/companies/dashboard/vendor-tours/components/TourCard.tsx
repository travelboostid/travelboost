import {
  copy,
  viewBrochure,
} from '@/actions/App/Http/Controllers/Companies/Dashboard/VendorTourCatalogController';
import type { TourResource } from '@/api/model';
import { useFloatingChatWidgetContext } from '@/components/chat/state';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { extractImageSrc } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { IconPdf } from '@tabler/icons-react';
import { MessageSquareIcon, SaveIcon } from 'lucide-react';
import { useState } from 'react';

export default function TourCard({ tour }: { tour: TourResource }) {
  const { company } = usePageSharedDataProps();
  const floatingChat = useFloatingChatWidgetContext();
  const [startingPrivateChat, setStartingPrivateChat] = useState(false);
  const hasDocument = Boolean(tour.document);
  const { src, srcSet } = extractImageSrc(tour.image as any);
  const handleCopy = () => {
    router.post(
      copy({
        company: company.username,
        vendor: tour.company?.username || '',
        tour: tour.id,
      }),
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          // optional: toast
        },
      },
    );
  };

  const handleViewBrochure = () => {
    if (!hasDocument) {
      return;
    }
    // open new tab
    const url = viewBrochure({
      company: company.username,
      vendor: tour.company?.username || '',
      tour: tour.id,
    }).url;
    window.open(url, '_blank');
  };

  const handleMessage = async () => {
    try {
      setStartingPrivateChat(true);
      floatingChat.setAttachment({ type: 'tour', data: tour });
      await floatingChat.startPrivateChat({
        type: 'company',
        id: tour.company_id,
      });
    } finally {
      setStartingPrivateChat(false);
    }
  };

  return (
    <Card className="relative mx-auto flex w-full flex-col overflow-hidden pt-0">
      <img
        src={src}
        srcSet={srcSet}
        alt="Event cover"
        className="relative z-20 aspect-video w-full object-cover"
      />
      <CardHeader>
        <CardTitle>{tour.name}</CardTitle>
        <CardDescription>{tour.description}</CardDescription>
      </CardHeader>
      <div className="flex-1" />
      <CardFooter className="flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          disabled={!hasDocument}
          onClick={handleViewBrochure}
        >
          <IconPdf />
          <span className="hidden md:inline">Brochures</span>
        </Button>
        <Button
          disabled={(tour as any).has_copied}
          onClick={handleCopy}
          className="flex-1"
        >
          <SaveIcon />
          <span className="hidden md:inline">Save Tour</span>
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
