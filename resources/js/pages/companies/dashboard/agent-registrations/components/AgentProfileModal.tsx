import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    CreditCardIcon,
    EyeIcon,
    MailIcon,
    MapPinIcon,
    PhoneIcon,
    UserIcon,
} from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

type AgentProfileProps = {
    agent: any;
    trigger?: React.ReactNode;
};

export default function AgentProfileModal({
    agent,
    trigger,
}: AgentProfileProps) {
    const intl = useIntl();

    const getImageUrl = (mediaObj: any, fallbackStr?: string) => {
        if (fallbackStr) return fallbackStr;
        if (!mediaObj) return null;

        if (mediaObj.data?.url) {
            return mediaObj.data.url;
        }

        if (mediaObj.data?.files) {
            const files = mediaObj.data.files;
            const file =
                files.find((f: any) => f.code === 'medium') || files[0];
            return file?.url;
        }

        return mediaObj.url || mediaObj.file_url || null;
    };

    const photoUrl = getImageUrl(agent.photo, agent.photo_url);
    const ktpUrl = getImageUrl(
        agent.identity_card || agent.identityCard,
        agent.identity_card_url,
    );

    const addressParts = [
        agent.address,
        agent.village_id,
        agent.district_id,
        agent.city_id,
        agent.province_id,
        agent.postal_code,
    ].filter(Boolean);

    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : '-';

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 dark:border-slate-800 dark:hover:border-blue-800/50"
                    >
                        <EyeIcon className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">
                            <FormattedMessage defaultMessage="View Profile" />
                        </span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md overflow-y-auto max-h-[90vh] dark:bg-slate-900 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="dark:text-slate-100">
                        <FormattedMessage defaultMessage="Agent Business Profile" />
                    </DialogTitle>
                    <DialogDescription className="dark:text-slate-400">
                        <FormattedMessage defaultMessage="Detailed information about the registered agent." />
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <Avatar className="h-16 w-16 border-2 border-white dark:border-slate-700 shadow-sm">
                            <AvatarImage
                                src={photoUrl}
                                alt={agent.name}
                                className="object-cover"
                            />
                            <AvatarFallback className="bg-white dark:bg-slate-800">
                                <UserIcon className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                                {agent.name}
                            </h3>
                            <Badge
                                variant="outline"
                                className="mt-1 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-medium"
                            >
                                <FormattedMessage
                                    defaultMessage="ID: {identifier}"
                                    values={{
                                        identifier: agent.username || agent.id,
                                    }}
                                />
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <MailIcon className="w-3.5 h-3.5" />
                                <FormattedMessage defaultMessage="Email Address" />
                            </span>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {agent.email}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <PhoneIcon className="w-3.5 h-3.5" />
                                <FormattedMessage defaultMessage="Phone Number" />
                            </span>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {agent.phone || '-'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <MapPinIcon className="w-3.5 h-3.5" />
                            <FormattedMessage defaultMessage="Address" />
                        </span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                            {fullAddress}
                        </p>
                    </div>

                    <div className="h-px w-full bg-slate-200/60 dark:bg-slate-800" />

                    <div className="space-y-1.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <CreditCardIcon className="w-3.5 h-3.5" />
                            <FormattedMessage defaultMessage="Identity Number (NIK)" />
                        </span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-wider">
                            {agent.identity_number || '-'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <FormattedMessage defaultMessage="ID Photo Document (KTP)" />
                        </span>
                        {ktpUrl ? (
                            <div className="relative group">
                                <img
                                    src={ktpUrl}
                                    alt={intl.formatMessage({
                                        defaultMessage: 'ID Document',
                                    })}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm object-contain bg-slate-50 dark:bg-slate-800/50 min-h-[150px]"
                                />
                                <a
                                    href={ktpUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm transition-all"
                                >
                                    <FormattedMessage defaultMessage="View Full Image" />
                                </a>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                                <CreditCardIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                                <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                                    <FormattedMessage defaultMessage="No document uploaded" />
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
