import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Fields } from '@puckeditor/core';
import type { ReactNode } from 'react';
import { LUCIDE_ICON_NAMES, LucideIconRenderer } from '../default/utils';
import {
    SectionHeader,
    columnGridClass,
    sectionContainerClass,
    sectionInnerClass,
    sectionStyleDefaults,
    sectionStyleFields,
    type SectionAlign,
    type SectionBackground,
    type SectionMaxWidth,
    type SectionPadding,
} from './section-styles';

export type FeatureItem = {
    icon: string;
    title: string;
    description: string;
};

export type FeaturesStyleProps = {
    padding: SectionPadding;
    align: SectionAlign;
    background: SectionBackground;
    maxWidth: SectionMaxWidth;
    columns: 2 | 3 | 4;
};

export const featuresStyleDefaults: FeaturesStyleProps = {
    ...sectionStyleDefaults,
    background: 'card',
    columns: 3,
};

export const featuresStyleFields = {
    ...sectionStyleFields,
    columns: {
        type: 'select' as const,
        label: 'Columns',
        options: [
            { value: 2, label: '2 Columns' },
            { value: 3, label: '3 Columns' },
            { value: 4, label: '4 Columns' },
        ],
    },
};

export const featureItemFields = {
    icon: {
        type: 'select' as const,
        label: 'Icon',
        options: LUCIDE_ICON_NAMES.slice(0, 80).map((name) => ({
            label: name,
            value: name,
        })),
    },
    title: { type: 'text' as const, label: 'Title', contentEditable: true },
    description: {
        type: 'text' as const,
        label: 'Description',
        contentEditable: true,
    },
};

export const featuresArrayField = {
    type: 'array' as const,
    label: 'Features',
    max: 8,
    arrayFields: featureItemFields,
    getItemSummary: (item: FeatureItem) => item.title || 'Feature',
};

export const defaultFeatureItems: FeatureItem[] = [
    {
        icon: 'MapPin',
        title: 'Exotic Destinations',
        description: 'Handpicked locations from around the globe',
    },
    {
        icon: 'Users',
        title: 'Expert Guides',
        description: 'Professional guides with years of experience',
    },
    {
        icon: 'Clock',
        title: 'Flexible Schedules',
        description: 'Tours that fit your availability',
    },
    {
        icon: 'Shield',
        title: '100% Safe',
        description: 'Travel insurance included in all packages',
    },
    {
        icon: 'CreditCard',
        title: 'Easy Payment',
        description: 'Multiple payment options and plans',
    },
    {
        icon: 'Plane',
        title: '24/7 Support',
        description: 'Assistance whenever you need it',
    },
];

export function FeatureIcon({
    icon,
    className,
    size = 'md',
}: {
    icon: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}) {
    const sizeClass = {
        sm: 'size-5',
        md: 'size-8',
        lg: 'size-10',
    }[size];

    return (
        <LucideIconRenderer
            name={icon}
            className={cn(sizeClass, 'shrink-0 text-primary', className)}
        />
    );
}

export function FeaturesSectionShell({
    badge,
    header,
    description,
    align,
    background,
    padding,
    maxWidth,
    inverted,
    children,
}: FeaturesStyleProps & {
    badge?: string;
    header: string;
    description: string;
    inverted?: boolean;
    children: ReactNode;
}) {
    return (
        <section className={sectionContainerClass({ padding, background })}>
            <div className={sectionInnerClass(maxWidth)}>
                <SectionHeader
                    badge={badge}
                    header={header}
                    description={description}
                    align={align}
                    inverted={inverted}
                />
                {children}
            </div>
        </section>
    );
}

export function featuresContentFields(): Fields<{
    badge: string;
    header: string;
    description: string;
    features: FeatureItem[];
}> {
    return {
        badge: {
            label: 'Badge / Eyebrow',
            type: 'text',
            contentEditable: true,
        },
        header: { label: 'Header', type: 'text', contentEditable: true },
        description: {
            label: 'Description',
            type: 'textarea',
            contentEditable: true,
        },
        features: featuresArrayField,
    };
}

export function FeatureCard({
    feature,
    className,
}: {
    feature: FeatureItem;
    className?: string;
}) {
    return (
        <Card
            className={cn(
                'border-border/60 p-6 transition hover:-translate-y-1 hover:shadow-lg',
                className,
            )}
        >
            <FeatureIcon icon={feature.icon} className="mb-4" size="lg" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
                {feature.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
            </p>
        </Card>
    );
}

export function FeatureRow({ feature }: { feature: FeatureItem }) {
    return (
        <div className="flex gap-4 rounded-xl border border-border/60 bg-card p-5 transition hover:border-primary/30 hover:shadow-md">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <FeatureIcon icon={feature.icon} size="md" />
            </div>
            <div>
                <h3 className="font-semibold text-foreground">
                    {feature.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    {feature.description}
                </p>
            </div>
        </div>
    );
}

export { columnGridClass };
