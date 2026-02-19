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
      floatingChat.setAttachment({ type: 'tour-code', data: tour.code });
      await floatingChat.startPrivateChat({
        type: 'company',
        id: tour.company_id,
      });
    } finally {
      setStartingPrivateChat(false);
    }
  };

  //03032026
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(tour.showprice ?? 0);

  const formattedEarlybird =
    tour.earlybird && tour.earlybird > 0
      ? new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0,
        }).format(tour.earlybird)
      : null;

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
        <CardDescription>{tour.destination}</CardDescription>
      </CardHeader>
      {/* ✅ HARGA */}
      <div className="px-6 pb-2">
        {formattedEarlybird ? (
          <div className="flex flex-col">
            {/* Harga normal dicoret */}
            <span className="text-sm text-muted-foreground line-through">
              {formattedPrice}
            </span>

            {/* Harga earlybird */}
            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded w-fit">
              EARLY BIRD
            </span>
            <span className="text-xl font-bold text-blue-600">
              {formattedEarlybird}
            </span>
            {/* ✅ Earlybird Note */}
            {tour.earlybird_note && (
              <span className="text-sm text-muted-foreground">
                {tour.earlybird_note}
              </span>
            )}
          </div>
        ) : (
          <div className="text-lg font-bold text-primary">{formattedPrice}</div>
        )}
      </div>
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
