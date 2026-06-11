import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { LUCIDE_ICON_NAMES, LucideIconRenderer } from '../default/utils';

export type FooterLink = { label: string; href: string };

export type FooterColumn = {
    title: string;
    links: FooterLink[];
};

export const footerLinkFields = {
    label: { type: 'text' as const, label: 'Label', contentEditable: true },
    href: { type: 'text' as const, label: 'URL' },
};

export const footerColumnField = {
    type: 'array' as const,
    label: 'Link Columns',
    max: 4,
    arrayFields: {
        title: {
            type: 'text' as const,
            label: 'Column Title',
            contentEditable: true,
        },
        links: {
            type: 'array' as const,
            label: 'Links',
            max: 6,
            arrayFields: footerLinkFields,
            getItemSummary: (item: FooterLink) => item.label || 'Link',
        },
    },
    getItemSummary: (item: FooterColumn) => item.title || 'Column',
};

export const defaultFooterColumns: FooterColumn[] = [
    {
        title: 'Destinations',
        links: [
            { label: 'Asia', href: '/tours' },
            { label: 'Europe', href: '/tours' },
            { label: 'Americas', href: '/tours' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About Us', href: '#about-us' },
            { label: 'Contact', href: '/tours' },
            { label: 'Careers', href: '/tours' },
        ],
    },
    {
        title: 'Support',
        links: [
            { label: 'FAQ', href: '/tours' },
            { label: 'Help Center', href: '/tours' },
            { label: 'Terms', href: '/tours' },
        ],
    },
];

export function FooterLinkList({
    columns,
    editMode,
    className,
}: {
    columns: FooterColumn[];
    editMode?: boolean;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'grid gap-8 sm:grid-cols-2 lg:grid-cols-3',
                className,
            )}
        >
            {columns.map((column, i) => (
                <div key={i}>
                    <h4 className="mb-4 text-sm font-semibold tracking-wide uppercase">
                        {column.title}
                    </h4>
                    <ul className="space-y-2.5">
                        {column.links.map((link, j) => (
                            <li key={j}>
                                {editMode ? (
                                    <span className="text-sm opacity-80">
                                        {link.label}
                                    </span>
                                ) : (
                                    <Link
                                        href={link.href}
                                        className="text-sm opacity-80 transition hover:opacity-100"
                                    >
                                        {link.label}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

export function FooterSocialLinks({
    socials,
    editMode,
}: {
    socials: { icon: string; href: string; label: string }[];
    editMode?: boolean;
}) {
    return (
        <div className="flex gap-3">
            {socials.map((social, i) =>
                editMode ? (
                    <span
                        key={i}
                        className="flex size-10 items-center justify-center rounded-full bg-primary-foreground/10 text-xs"
                    >
                        {social.label.slice(0, 2)}
                    </span>
                ) : (
                    <a
                        key={i}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="flex size-10 items-center justify-center rounded-full bg-primary-foreground/10 transition hover:bg-primary-foreground/20"
                    >
                        <LucideIconRenderer
                            name={social.icon}
                            className="size-4"
                        />
                    </a>
                ),
            )}
        </div>
    );
}

export const footerSocialField = {
    type: 'array' as const,
    label: 'Social Links',
    max: 5,
    arrayFields: {
        label: { type: 'text' as const, label: 'Platform' },
        href: { type: 'text' as const, label: 'URL' },
        icon: {
            type: 'select' as const,
            label: 'Icon',
            options: LUCIDE_ICON_NAMES.slice(0, 40).map((name) => ({
                label: name,
                value: name,
            })),
        },
    },
    getItemSummary: (item: { label: string }) => item.label || 'Social',
};

export const defaultFooterSocials = [
    { label: 'Instagram', href: '#', icon: 'Instagram' },
    { label: 'Facebook', href: '#', icon: 'Facebook' },
    { label: 'Twitter', href: '#', icon: 'Twitter' },
];
