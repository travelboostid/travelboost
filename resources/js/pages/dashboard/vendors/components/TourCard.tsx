import {
  brochure,
  copy,
} from '@/actions/App/Http/Controllers/DashboardVendorController';
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
import { extractImageSrc } from '@/lib/utils';
import type { Auth } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { IconPdf, IconBrandFacebook } from '@tabler/icons-react';
import { MessageSquareIcon, SaveIcon } from 'lucide-react';
import { useState } from 'react';

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
  has_copied: boolean;
};

export default function TourCard({ tour }: { tour: TourResource }) {
  const floatingChat = useFloatingChatWidgetContext();
  const { username } = usePage<{ username: string; auth: Auth }>().props;
  const [startingPrivateChat, setStartingPrivateChat] = useState(false);
  const hasDocument = Boolean(tour.document);
  const { src, srcSet } = extractImageSrc(tour.image as any);
  const handleCopy = () => {
    router.post(
      copy({ username, tour: tour.id }),
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
    const url = brochure({ username, tour: tour.id }).url;
    window.open(url, '_blank');
  };
  const handleMessage = async () => {
    try {
      setStartingPrivateChat(true);
      floatingChat.setAttachment({ type: 'tour', data: tour });
      await floatingChat.startPrivateChat(tour.user_id);
    } finally {
      setStartingPrivateChat(false);
    }
  };

  //26022026 share to fb
  const shareUrl = `${window.location.origin}/@${tour.name}/tours/${tour.id}`;
  //console.log('shareUrl:', shareUrl);

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl,
    )}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareFacebookPdf = () => {
    if (!hasDocument) return;

    const pdfUrl = brochure({ username, tour: tour.id }).url;

    console.log('PDF URL:', pdfUrl);

    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      pdfUrl,
    )}`;

    window.open(fbUrl, '_blank', 'noopener,noreferrer');
  };
  //

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
      {/* fix screen for desktop and mobile */}
      {/*<CardFooter className="flex gap-2"> */}
      <CardFooter className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Button
          variant="secondary"
          //className="flex-1"
          disabled={!hasDocument}
          onClick={handleViewBrochure}
        >
          <IconPdf />
          {/*<span className="hidden md:inline">Brochures</span> */}
        </Button>
        <Button
          disabled={tour.has_copied}
          onClick={handleCopy}
          //className="flex-1"
        >
          <SaveIcon />
          {/* <span className="hidden md:inline">Save Tour</span> */}
        </Button>
        <Button
          onClick={handleMessage}
          disabled={startingPrivateChat}
          variant="secondary"
          //className="flex-1"
        >
          {startingPrivateChat ? <Spinner /> : <MessageSquareIcon />}
        </Button>

        {/* ✅ SHARE FACEBOOK */}
        <Button
          variant="secondary"
          //onClick={handleShareFacebook}
          onClick={handleShareFacebookPdf}
          disabled={!hasDocument}
          //className="flex-1"
        >
          <IconBrandFacebook />
          {/* <span className="hidden md:inline">Share</span> */}
        </Button>
      </CardFooter>
    </Card>
  );
}
