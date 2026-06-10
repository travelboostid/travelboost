import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import { CheckIcon, XIcon } from 'lucide-react';
import {
    ContentSection,
    contentHeaderFields,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';

export type ComparisonPlan = {
    name: string;
    price: string;
    period: string;
    highlighted: boolean;
    features: { label: string; included: boolean }[];
};

export type ComparisonComponentProps = ContentStyleProps & {
    badge: string;
    header: string;
    description: string;
    plans: ComparisonPlan[];
};

export const ComparisonComponentConfig: ComponentConfig<ComparisonComponentProps> =
    {
        label: 'Comparison Table',
        fields: {
            ...contentHeaderFields(),
            ...contentStyleFields,
            plans: {
                type: 'array',
                label: 'Plans',
                max: 4,
                arrayFields: {
                    name: {
                        type: 'text',
                        label: 'Name',
                        contentEditable: true,
                    },
                    price: {
                        type: 'text',
                        label: 'Price',
                        contentEditable: true,
                    },
                    period: {
                        type: 'text',
                        label: 'Period',
                        contentEditable: true,
                    },
                    highlighted: {
                        type: 'radio',
                        label: 'Highlighted',
                        options: [
                            { value: true, label: 'Yes' },
                            { value: false, label: 'No' },
                        ],
                    },
                    features: {
                        type: 'array',
                        label: 'Features',
                        max: 10,
                        arrayFields: {
                            label: {
                                type: 'text',
                                label: 'Feature',
                                contentEditable: true,
                            },
                            included: {
                                type: 'radio',
                                label: 'Included',
                                options: [
                                    { value: true, label: 'Yes' },
                                    { value: false, label: 'No' },
                                ],
                            },
                        },
                        getItemSummary: (item) => item.label || 'Feature',
                    },
                },
                getItemSummary: (item) => item.name || 'Plan',
            },
        } as ComponentConfig<ComparisonComponentProps>['fields'],
        defaultProps: {
            badge: 'Compare',
            header: 'Choose the Right Package',
            description:
                'See what is included in each travel package at a glance',
            ...contentStyleDefaults,
            plans: [
                {
                    name: 'Essential',
                    price: '$499',
                    period: '/person',
                    highlighted: false,
                    features: [
                        { label: '3-day guided tour', included: true },
                        { label: 'Hotel accommodation', included: true },
                        { label: 'Daily breakfast', included: true },
                        { label: 'Airport transfer', included: false },
                        { label: 'Travel insurance', included: false },
                    ],
                },
                {
                    name: 'Premium',
                    price: '$899',
                    period: '/person',
                    highlighted: true,
                    features: [
                        { label: '7-day guided tour', included: true },
                        { label: '4-star hotel stay', included: true },
                        { label: 'All meals included', included: true },
                        { label: 'Airport transfer', included: true },
                        { label: 'Travel insurance', included: true },
                    ],
                },
                {
                    name: 'Luxury',
                    price: '$1,499',
                    period: '/person',
                    highlighted: false,
                    features: [
                        { label: '14-day premium tour', included: true },
                        { label: '5-star resort stay', included: true },
                        { label: 'Private guide', included: true },
                        { label: 'Airport transfer', included: true },
                        { label: 'Travel insurance', included: true },
                    ],
                },
            ],
        },
        render: ({
            badge,
            header,
            description,
            plans,
            padding,
            align,
            background,
            maxWidth,
        }) => (
            <ContentSection
                badge={badge}
                header={header}
                description={description}
                align={align}
                padding={padding}
                background={background}
                maxWidth={maxWidth}
            >
                <div className="overflow-x-auto rounded-2xl border border-border">
                    <table className="w-full min-w-[640px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="p-4 text-left font-medium text-muted-foreground">
                                    Features
                                </th>
                                {plans.map((plan, i) => (
                                    <th key={i} className="p-4 text-center">
                                        <div
                                            className={cn(
                                                'mx-auto max-w-[160px] space-y-1',
                                                plan.highlighted &&
                                                    'rounded-xl bg-primary/5 p-3 ring-1 ring-primary/20',
                                            )}
                                        >
                                            {plan.highlighted && (
                                                <Badge className="mb-1">
                                                    Recommended
                                                </Badge>
                                            )}
                                            <p className="font-semibold text-foreground">
                                                {plan.name}
                                            </p>
                                            <p className="text-lg font-bold text-primary">
                                                {plan.price}
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    {plan.period}
                                                </span>
                                            </p>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {plans[0]?.features.map((_, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    className="border-b border-border/50 last:border-0"
                                >
                                    <td className="p-4 font-medium text-foreground">
                                        {plans[0].features[rowIndex]?.label}
                                    </td>
                                    {plans.map((plan, colIndex) => {
                                        const feature = plan.features[rowIndex];

                                        return (
                                            <td
                                                key={colIndex}
                                                className="p-4 text-center"
                                            >
                                                {feature?.included ? (
                                                    <CheckIcon className="mx-auto size-5 text-primary" />
                                                ) : (
                                                    <XIcon className="mx-auto size-5 text-muted-foreground/40" />
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </ContentSection>
        ),
    };
