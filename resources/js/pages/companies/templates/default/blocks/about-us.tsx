import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DEFAULT_PHOTO } from '@/config';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import type { ComponentConfig } from '@puckeditor/core';
import { BuildingIcon, MailIcon, MapPinIcon, PhoneIcon } from 'lucide-react';

export type AboutUsComponentProps = {
  header: string;
  description: string;
};

export const AboutUsComponentConfig: ComponentConfig<AboutUsComponentProps> = {
  label: 'About Us',
  fields: {
    header: { label: 'Header', type: 'text', contentEditable: true },
    description: { label: 'Description', type: 'text', contentEditable: true },
  },
  defaultProps: {
    header: 'Tentang Kami',
    description:
      'Kenali lebih dekat agen perjalanan Anda dan hubungi kami kapan saja.',
  },
  render: ({ header, description, editMode }) => {
    return (
      <AboutUsRenderer
        header={header}
        description={description}
        editMode={editMode}
      />
    );
  },
};

function AboutUsRenderer({
  header,
  description,
  editMode,
}: AboutUsComponentProps & { editMode?: boolean }) {
  const shared = usePageSharedDataProps();
  const company = shared?.tenant ?? shared?.company;

  const name = company?.name ?? (editMode ? 'Nama Agen Anda' : '-');
  const address =
    company?.address ??
    (editMode ? 'Jl. Contoh Alamat No. 123, Jakarta' : '-');
  const phone =
    company?.customer_service_phone ??
    company?.phone ??
    (editMode ? '+62 812 3456 7890' : '-');
  const email = company?.email ?? (editMode ? 'agent@example.com' : '-');
  const logoUrl = company?.photo_url ?? (editMode ? DEFAULT_PHOTO : undefined);

  return (
    <section id="about-us" className="py-8 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 space-y-4 text-center sm:mb-16">
          <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">
            {header}
          </h2>
          <p className="text-muted-foreground text-xl">{description}</p>
        </div>

        {/* Card */}
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Logo */}
            <Avatar className="size-24 shrink-0 rounded-xl">
              <AvatarImage src={logoUrl} alt={name} />
              <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-2xl">
                <BuildingIcon className="size-10" />
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 space-y-4 text-center sm:text-left">
              <h3 className="text-xl font-semibold">{name}</h3>

              <div className="space-y-3 text-muted-foreground">
                <div className="flex items-start gap-3">
                  <MapPinIcon className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span>{address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="size-5 shrink-0 text-primary" />
                  <span>{phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MailIcon className="size-5 shrink-0 text-primary" />
                  <span>{email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
