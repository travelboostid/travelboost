import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import {
    FooterLinkList,
    FooterSocialLinks,
    defaultFooterColumns,
    defaultFooterSocials,
    footerColumnField,
    footerSocialField,
    type FooterColumn,
} from '../../components/footer-shared';

export type Footer2ComponentProps = {
    brandName: string;
    tagline: string;
    copyright: string;
    variant: 'dark' | 'muted' | 'primary';
    columns: FooterColumn[];
    socials: { icon: string; href: string; label: string }[];
    showSocials: boolean;
};

export const Footer2ComponentConfig: ComponentConfig<Footer2ComponentProps> = {
    label: 'Multi Column',
    fields: {
        brandName: {
            type: 'text',
            label: 'Brand Name',
            contentEditable: true,
        },
        tagline: {
            type: 'textarea',
            label: 'Tagline',
            contentEditable: true,
        },
        copyright: {
            type: 'text',
            label: 'Copyright',
            contentEditable: true,
        },
        variant: {
            type: 'select',
            label: 'Style',
            options: [
                { value: 'dark', label: 'Dark' },
                { value: 'muted', label: 'Muted' },
                { value: 'primary', label: 'Primary' },
            ],
        },
        showSocials: {
            type: 'radio',
            label: 'Show Social Links',
            options: [
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
            ],
        },
        columns: footerColumnField,
        socials: footerSocialField,
    },
    defaultProps: {
        brandName: 'TravelBoost',
        tagline:
            'Your trusted partner for unforgettable journeys around the world.',
        copyright: '© 2025 TravelBoost. All rights reserved.',
        variant: 'dark',
        showSocials: true,
        columns: defaultFooterColumns,
        socials: defaultFooterSocials,
    },
    render: ({
        brandName,
        tagline,
        copyright,
        variant,
        columns,
        socials,
        showSocials,
        editMode,
    }) => {
        const variantClass = {
            dark: 'bg-foreground text-primary-foreground',
            muted: 'bg-muted text-foreground',
            primary: 'bg-primary text-primary-foreground',
        }[variant];

        return (
            <footer className={cn('px-4 py-16 sm:px-6 lg:px-8', variantClass)}>
                <div className="mx-auto max-w-7xl">
                    <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold">{brandName}</h3>
                            <p className="max-w-sm text-sm leading-relaxed opacity-80">
                                {tagline}
                            </p>
                            {showSocials && (
                                <FooterSocialLinks
                                    socials={socials}
                                    editMode={editMode}
                                />
                            )}
                        </div>
                        <FooterLinkList columns={columns} editMode={editMode} />
                    </div>
                    <div className="mt-12 border-t border-current/10 pt-8 text-center text-sm opacity-70">
                        {copyright}
                    </div>
                </div>
            </footer>
        );
    },
};
