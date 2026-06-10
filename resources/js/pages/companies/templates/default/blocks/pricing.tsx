import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import type { ComponentConfig } from '@puckeditor/core';
import { CheckIcon, SparklesIcon } from 'lucide-react';
import type { LinkButtonComponentProps } from '../../base/blocks/link-button';
import {
    sectionContainerClass,
    SectionHeader,
    sectionHeaderFields,
    sectionInnerClass,
    sectionStyleDefaults,
    sectionStyleFields,
    type SectionAlign,
    type SectionBackground,
    type SectionMaxWidth,
    type SectionPadding,
} from '../../components/section-styles';

export type PricingPlan = {
    name: string;
    price: string;
    period: string;
    description: string;
    features: { feature: string }[];
    featured: boolean;
    featuredLabel: string;
    actionLabel: string;
    actionHref: string;
    actionVariant: LinkButtonComponentProps['variant'];
};

export type PricingComponentProps = {
    badge: string;
    header: string;
    description: string;
    padding: SectionPadding;
    align: SectionAlign;
    background: SectionBackground;
    maxWidth: SectionMaxWidth;
    plans: PricingPlan[];
};

export const PricingComponentConfig: ComponentConfig<PricingComponentProps> = {
    label: 'Pricing',
    fields: {
        ...sectionHeaderFields(),
        ...sectionStyleFields,
        plans: {
            type: 'array',
            label: 'Plans',
            max: 4,
            arrayFields: {
                name: { type: 'text', label: 'Name', contentEditable: true },
                price: { type: 'text', label: 'Price', contentEditable: true },
                period: {
                    type: 'text',
                    label: 'Period',
                    contentEditable: true,
                },
                description: {
                    type: 'text',
                    label: 'Description',
                    contentEditable: true,
                },
                featured: {
                    type: 'radio',
                    label: 'Featured',
                    options: [
                        { value: true, label: 'Yes' },
                        { value: false, label: 'No' },
                    ],
                },
                featuredLabel: {
                    type: 'text',
                    label: 'Featured Badge Text',
                    contentEditable: true,
                },
                features: {
                    type: 'array',
                    label: 'Features',
                    max: 8,
                    arrayFields: {
                        feature: {
                            type: 'text',
                            label: 'Feature',
                            contentEditable: true,
                        },
                    },
                    getItemSummary: (item) => item.feature || 'Feature',
                },
                actionLabel: {
                    type: 'text',
                    label: 'Button Label',
                    contentEditable: true,
                },
                actionHref: { type: 'text', label: 'Button URL' },
                actionVariant: {
                    type: 'select',
                    label: 'Button Variant',
                    options: [
                        { value: 'default', label: 'Default' },
                        { value: 'outline', label: 'Outline' },
                        { value: 'secondary', label: 'Secondary' },
                    ],
                },
            },
            getItemSummary: (item) => item.name || 'Plan',
        },
    },
    defaultProps: {
        badge: 'Pricing',
        header: 'Choose Your Adventure',
        description: 'Flexible packages for every type of traveler',
        ...sectionStyleDefaults,
        plans: [
            {
                name: 'Explorer',
                price: '$499',
                period: '/person',
                description: 'Perfect for solo travelers and couples',
                featured: false,
                featuredLabel: 'Most Popular',
                features: [
                    { feature: '3-day guided tour' },
                    { feature: 'Hotel accommodation' },
                    { feature: 'Daily breakfast' },
                ],
                actionLabel: 'Get Started',
                actionHref: '/tours',
                actionVariant: 'outline',
            },
            {
                name: 'Adventurer',
                price: '$899',
                period: '/person',
                description: 'Our most popular package for groups',
                featured: true,
                featuredLabel: 'Most Popular',
                features: [
                    { feature: '7-day guided tour' },
                    { feature: '4-star hotel stay' },
                    { feature: 'All meals included' },
                    { feature: 'Airport transfers' },
                ],
                actionLabel: 'Book Now',
                actionHref: '/tours',
                actionVariant: 'default',
            },
            {
                name: 'Premium',
                price: '$1,499',
                period: '/person',
                description: 'Luxury experience with VIP treatment',
                featured: false,
                featuredLabel: 'Most Popular',
                features: [
                    { feature: '14-day premium tour' },
                    { feature: '5-star resort stay' },
                    { feature: 'Private guide' },
                    { feature: 'Travel insurance' },
                ],
                actionLabel: 'Contact Us',
                actionHref: '/tours',
                actionVariant: 'outline',
            },
        ],
    },
    render: ({
        badge,
        header,
        description,
        padding,
        align,
        background,
        maxWidth,
        plans,
        editMode,
    }) => (
        <section className={sectionContainerClass({ padding, background })}>
            <div className={sectionInnerClass(maxWidth)}>
                <SectionHeader
                    badge={badge}
                    header={header}
                    description={description}
                    align={align}
                    inverted={background === 'primary'}
                />
                <div
                    className={cn(
                        'grid gap-6',
                        plans.length === 1 && 'mx-auto max-w-md',
                        plans.length === 2 && 'md:grid-cols-2',
                        plans.length >= 3 && 'md:grid-cols-2 lg:grid-cols-3',
                        plans.length === 4 && 'lg:grid-cols-4',
                    )}
                >
                    {plans.map((plan, i) => (
                        <Card
                            key={i}
                            className={cn(
                                'relative flex flex-col transition duration-300',
                                plan.featured
                                    ? 'z-10 scale-[1.02] border-primary bg-card shadow-xl ring-2 ring-primary/20'
                                    : 'border-border/60 hover:-translate-y-1 hover:shadow-lg',
                            )}
                        >
                            {plan.featured && (
                                <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-md">
                                    <SparklesIcon className="size-3" />
                                    {plan.featuredLabel || 'Most Popular'}
                                </span>
                            )}
                            <CardHeader className="pb-4 text-center">
                                <CardTitle className="text-xl">
                                    {plan.name}
                                </CardTitle>
                                <div className="mt-4 flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-bold tracking-tight text-foreground">
                                        {plan.price}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {plan.period}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                    {plan.description}
                                </p>
                            </CardHeader>
                            <CardContent className="flex-1 border-t border-border/50 pt-6">
                                <ul className="space-y-3">
                                    {plan.features.map((feature, j) => (
                                        <li
                                            key={j}
                                            className="flex items-start gap-3 text-sm"
                                        >
                                            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                                <CheckIcon className="size-3 text-primary" />
                                            </span>
                                            {feature.feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter className="pt-2 pb-6">
                                {editMode ? (
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        variant={plan.actionVariant}
                                    >
                                        {plan.actionLabel}
                                    </Button>
                                ) : (
                                    <Button
                                        asChild
                                        className="w-full"
                                        size="lg"
                                        variant={plan.actionVariant}
                                    >
                                        <Link href={plan.actionHref}>
                                            {plan.actionLabel}
                                        </Link>
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    ),
};
