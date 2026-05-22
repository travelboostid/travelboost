import usePageProps from '@/hooks/use-page-props';
import { IconBrandWhatsapp } from '@tabler/icons-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export default function StartWhatsappChatButton() {
    const { company } = usePageProps();

    const phone = company?.customer_service_phone || company?.phone;

    if (!phone) {
        return null;
    }

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
        'Hello, I would like to inquire about your services.',
    )}`;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    asChild
                    className="mr-1 h-14 w-14 rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.4)] transition-transform hover:scale-110 hover:bg-[#1ebe5d]"
                >
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <IconBrandWhatsapp className="size-7" />
                    </a>
                </Button>
            </TooltipTrigger>

            <TooltipContent side="left">WhatsApp</TooltipContent>
        </Tooltip>
    );
}
