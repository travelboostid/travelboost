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
import { IconPdf, IconBrandFacebook, IconBrandWhatsapp } from '@tabler/icons-react';
import { MessageSquareIcon, SaveIcon } from 'lucide-react';
import { useState } from 'react';

//27032026
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

//export default function TourCard({ tour }: { tour: TourResource }) {
export default function TourCard({
  tour,
  type = 'agent',
  fromLogin = true,
  //test = true,
}: {
  tour: TourResource
  type?: string
  fromLogin? : boolean
  //test?: boolean
}) {
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

  /*const handleViewBrochure = () => {
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
  };*/

  const handleViewBrochure = () => {
    if (!hasDocument) return;

    if(!fromLogin){
      const url = `/brochure/${tour.company?.username}/${tour.id}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    else {
      const url = viewBrochure({
        company: company.username,
        vendor: tour.company?.username || '',
        tour: tour.id,
      }).url;
      window.open(url, '_blank');
    }
    
  };

  /*const handleMessage = async () => {
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
  };*/

  const handleMessage = async () => {
    console.log("CLICKED");

    try {
      setStartingPrivateChat(true);

      console.log("floatingChat:", floatingChat);

      floatingChat?.setAttachment({
        type: 'tour-code',
        data: tour.code,
      });

      await floatingChat?.startPrivateChat({
        type: 'company',
        id: tour.company_id,
      });

      console.log("CHAT STARTED");
    } catch (err) {
      console.error("CHAT ERROR:", err);
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

    const pdfUrl = viewBrochure({
      company: company.username,
      vendor: tour.company?.username || '',
      tour: tour.id,
    }).url;

    const fbUrl =
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pdfUrl)}`;

    window.open(fbUrl, '_blank', 'noopener,noreferrer');
  };

  const handleChatWhatsApp = () => {
    //const phone = tour.user_phone; // contoh: "628123456789"
    const phone = tour.user?.phone;
    if (!phone) return;

    const message = encodeURIComponent(
      `Halo, saya tertarik dengan tour *${tour.name}*. Bisa info lebih lanjut?`
    );

    const waUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
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

  const formattedpromoprice =
    tour.promoprice && tour.promoprice > 0
      ? new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0,
        }).format(tour.promoprice)
      : null;

  const formattedpromoteprice =
    tour.promote_price && tour.promote_price > 0
      ? new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0,
        }).format(tour.promote_price)
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
            <span className="text-sm text-muted-foreground">
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
        ) 

        : formattedpromoprice ?(
          <div className="flex flex-col">
            {/* Harga normal dicoret */}
            <span className="text-sm text-muted-foreground line-through">
              {formattedPrice}
            </span>

            {/* Harga earlybird */}
            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded w-fit">
              PROMO
            </span>
            <span className="text-xl font-bold text-red-600">
              {formattedpromoprice}
            </span>
          </div>
        )

        : formattedpromoteprice ?(
          <div className="flex flex-col">
            {/* Harga normal dicoret */}
            <span className="text-sm text-muted-foreground line-through">
              {formattedPrice}
            </span>

            {/* Harga earlybird */}
            {/* ✅ Earlybird Note */}
            {tour.promote_title && (
              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded w-fit">
                {tour.promote_title}
              </span>
            )}
            <span className="text-xl font-bold text-blue-600">
              {formattedpromoteprice}
            </span>
            {/* ✅ Earlybird Note */}
            {tour.promote_note && (
              <span className="text-sm text-muted-foreground">
                {tour.promote_note}
              </span>
            )}
          </div>
        )

        : (
          <div className="text-lg font-bold text-primary">{formattedPrice}</div>
        )}
      </div>
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
        </Button>
        
        {type === 'agent' && fromLogin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={(tour as any).has_copied}
              >
                <SaveIcon />
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Copy to Catalog
                </AlertDialogTitle>

                <AlertDialogDescription>
                  Do you want copy to your Catalog?
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>
                  No
                </AlertDialogCancel>

                <AlertDialogAction onClick={handleCopy}>
                  Yes
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        
        {type === 'agent' && (
          <Button
          onClick={handleMessage}
          disabled={startingPrivateChat}
          variant="secondary"
          //className="flex-1"
        >
          {startingPrivateChat ? <Spinner /> : <MessageSquareIcon />}
        </Button>
        )}

        {/* ✅ SHARE FACEBOOK */}
        {/* !hasDocument && ( */}
          {hasDocument && type === 'agent' && !fromLogin && (
        <Button
          variant="secondary"
          //onClick={handleShareFacebook}
          onClick={handleShareFacebookPdf}
          disabled={!hasDocument}
          //disabled={hasDocument}
          //className="flex-1"
        >
          <IconBrandFacebook />
          {/* <span className="hidden md:inline">Share</span> */}
        </Button>
        )}

        {/*<Button
          variant="secondary"
          onClick={handleChatWhatsApp}
          //className="flex-1"
        >
          <IconBrandWhatsapp /> */}
          {/* <span className="hidden md:inline">WhatsApp</span> */}
        {/* </Button> */}
      </CardFooter>
      {/* div className="flex-1" /> */}
      <div className="px-6 pb-2">
        <div className="text-xs font-bold text-primary">Status : {tour.status}</div>
      </div>
    </Card>
  );
}

