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
import dayjs from 'dayjs';
import {
  CreditCardIcon,
  EyeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from 'lucide-react';

type AgentProfileProps = {
  agent: any;
};

export default function AgentProfileModal({ agent }: AgentProfileProps) {
  const getImageUrl = (mediaObj: any, fallbackStr?: string) => {
    if (fallbackStr) return fallbackStr;
    if (!mediaObj) return null;
    if (typeof mediaObj === 'string') return mediaObj;
    return (
      mediaObj.url ||
      mediaObj.original_url ||
      mediaObj.data?.url ||
      mediaObj.preview_url ||
      null
    );
  };

  const photoUrl = getImageUrl(agent.photo, agent.photo_url);
  const ktpUrl = getImageUrl(agent.identity_card, agent.identity_card_url);

  const addressParts = [
    agent.address,
    agent.village?.name || agent.village_id,
    agent.district?.name || agent.district_id,
    agent.city?.name || agent.city_id,
    agent.province?.name || agent.province_id,
    agent.postal_code,
  ].filter(Boolean);

  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : '-';
  const initials = agent.name ? agent.name.charAt(0).toUpperCase() : 'U';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl border-slate-200 hover:bg-slate-50 hover:text-primary transition-all font-semibold shadow-sm"
        >
          <EyeIcon className="h-4 w-4" />
          View Profile
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl p-6 md:p-8 overflow-y-auto max-h-[90vh] border-none shadow-2xl bg-white rounded-3xl sm:rounded-[2rem]">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-bold text-slate-900">
            Complete Agent Profile
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Detailed view of the selected agent's profile and identification.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center mb-8">
          <Avatar className="w-24 h-24 mb-4 ring-4 ring-primary/5">
            <AvatarImage src={photoUrl || ''} className="object-cover" />
            <AvatarFallback className="bg-blue-50 text-blue-600 text-3xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-slate-900">{agent.name}</h2>
          <Badge
            variant="outline"
            className="mt-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase rounded-full px-4 py-1"
          >
            AGENT
          </Badge>
        </div>

        <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <span className="text-xs text-slate-500">Username</span>
              <p className="text-sm font-semibold text-slate-900">
                {agent.username || '-'}
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-slate-500">Joined Date</span>
              <p className="text-sm font-semibold text-blue-600">
                {agent.created_at
                  ? dayjs(agent.created_at).format('D/M/YYYY')
                  : '-'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <MailIcon className="w-3.5 h-3.5" /> Email Address
              </span>
              <p className="text-sm font-semibold text-slate-900">
                {agent.email || '-'}
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <PhoneIcon className="w-3.5 h-3.5" /> Phone Number
              </span>
              <p className="text-sm font-semibold text-slate-900">
                {agent.phone || '-'}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <MapPinIcon className="w-3.5 h-3.5" /> Address
            </span>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
              {fullAddress}
            </p>
          </div>

          <div className="h-px w-full bg-slate-200/60" />

          <div className="space-y-1.5">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <CreditCardIcon className="w-3.5 h-3.5" /> Identity Number (NIK)
            </span>
            <p className="text-sm font-semibold text-slate-900 tracking-wider">
              {agent.identity_number || '-'}
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-slate-500">ID Photo Document</span>
            {ktpUrl ? (
              <img
                src={ktpUrl}
                alt="ID Document"
                className="w-full max-w-sm rounded-xl border border-slate-200 shadow-sm object-contain bg-white"
              />
            ) : (
              <p className="text-sm text-slate-400 italic">
                No document uploaded
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
