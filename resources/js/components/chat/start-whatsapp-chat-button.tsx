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
                    className="h-[3.25rem] w-[3.25rem] rounded-2xl border border-emerald-200/70 bg-[#25D366] text-white shadow-sm shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#1ebe5d] hover:shadow-lg hover:shadow-emerald-500/25"
                >
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <IconBrandWhatsapp className="size-6" />
                    </a>
                </Button>
            </TooltipTrigger>

            <TooltipContent side="left">WhatsApp</TooltipContent>
        </Tooltip>
    );
}
