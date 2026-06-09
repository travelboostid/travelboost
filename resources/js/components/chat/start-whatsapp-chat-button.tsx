import usePageProps from '@/hooks/use-page-props';
import { IconBrandWhatsapp } from '@tabler/icons-react';
import { Building2Icon, ExternalLinkIcon, PhoneIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

type WhatsappVendor = {
    name: string;
    username: string;
    phone: string | null;
};

function normalizeWhatsappPhone(phone?: string | null) {
    if (!phone) {
        return null;
    }

    const digits = phone.replace(/\D/g, '');

    if (!digits) {
        return null;
    }

    if (digits.startsWith('0')) {
        return `62${digits.slice(1)}`;
    }

    return digits;
}

function whatsappUrl(phone?: string | null) {
    const normalizedPhone = normalizeWhatsappPhone(phone);

    if (!normalizedPhone) {
        return null;
    }

    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
        'Hello, I would like to inquire about your services.',
    )}`;
}

export default function StartWhatsappChatButton() {
    const { company, agentWhatsappVendors = [] } = usePageProps<{
        agentWhatsappVendors?: WhatsappVendor[];
    }>();
    const [open, setOpen] = useState(false);

    const companyType = company?.type;
    const directWhatsappUrl = useMemo(() => {
        return whatsappUrl(company?.customer_service_phone || company?.phone);
    }, [company?.customer_service_phone, company?.phone]);

    if (companyType === 'vendor') {
        return null;
    }

    const hasVendorContacts =
        companyType === 'agent' && agentWhatsappVendors.length > 0;

    if (!hasVendorContacts && !directWhatsappUrl) {
        return null;
    }

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        asChild={!hasVendorContacts}
                        onClick={
                            hasVendorContacts ? () => setOpen(true) : undefined
                        }
                        className="h-11 w-11 rounded-xl border border-emerald-200/70 bg-[#25D366] text-white shadow-sm shadow-emerald-500/20 transition-all hover:-translate-x-0.5 hover:bg-[#1ebe5d] hover:shadow-lg hover:shadow-emerald-500/25"
                    >
                        {hasVendorContacts ? (
                            <IconBrandWhatsapp className="size-5" />
                        ) : (
                            <a
                                href={directWhatsappUrl ?? '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <IconBrandWhatsapp className="size-5" />
                            </a>
                        )}
                    </Button>
                </TooltipTrigger>

                <TooltipContent side="top">WhatsApp</TooltipContent>
            </Tooltip>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Vendor WhatsApp Contacts</DialogTitle>
                        <DialogDescription>
                            Choose an active vendor partner to continue the
                            conversation on WhatsApp.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        {agentWhatsappVendors.map((vendor) => {
                            const url = whatsappUrl(vendor.phone);

                            return (
                                <div
                                    key={vendor.username}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                                            <Building2Icon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
                                                {vendor.name}
                                            </p>
                                            <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                                                <PhoneIcon className="h-3.5 w-3.5" />
                                                {vendor.phone ||
                                                    'No WhatsApp number'}
                                            </p>
                                        </div>
                                    </div>

                                    {url ? (
                                        <Button
                                            asChild
                                            size="sm"
                                            className="rounded-lg bg-[#25D366] text-white hover:bg-[#1ebe5d]"
                                        >
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Open
                                                <ExternalLinkIcon className="ml-1.5 h-3.5 w-3.5" />
                                            </a>
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            disabled
                                            className="rounded-lg"
                                        >
                                            Open
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
