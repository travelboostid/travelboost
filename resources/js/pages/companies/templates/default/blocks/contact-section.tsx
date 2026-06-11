import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import {
    ContentSection,
    contentHeaderFields,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';
import { LUCIDE_ICON_NAMES, LucideIconRenderer } from '../utils';

export type ContactItem = {
    icon: string;
    label: string;
    value: string;
    href: string;
};

export type ContactSectionComponentProps = ContentStyleProps & {
    badge: string;
    header: string;
    description: string;
    columns: 2 | 3 | 4;
    items: ContactItem[];
};

export const ContactSectionComponentConfig: ComponentConfig<ContactSectionComponentProps> =
    {
        label: 'Contact Cards',
        fields: {
            ...contentHeaderFields(),
            ...contentStyleFields,
            columns: {
                type: 'select',
                label: 'Columns',
                options: [
                    { value: 2, label: '2 Columns' },
                    { value: 3, label: '3 Columns' },
                    { value: 4, label: '4 Columns' },
                ],
            },
            items: {
                type: 'array',
                label: 'Contact Items',
                max: 6,
                arrayFields: {
                    icon: {
                        type: 'select',
                        label: 'Icon',
                        options: LUCIDE_ICON_NAMES.slice(0, 60).map((name) => ({
                            label: name,
                            value: name,
                        })),
                    },
                    label: {
                        type: 'text',
                        label: 'Label',
                        contentEditable: true,
                    },
                    value: {
                        type: 'text',
                        label: 'Value',
                        contentEditable: true,
                    },
                    href: { type: 'text', label: 'Link URL (optional)' },
                },
                getItemSummary: (item) => item.label || 'Contact',
            },
        } as ComponentConfig<ContactSectionComponentProps>['fields'],
        defaultProps: {
            badge: 'Get in Touch',
            header: 'We Are Here to Help',
            description:
                'Reach out anytime — our team responds within 24 hours',
            ...contentStyleDefaults,
            background: 'card',
            columns: 3,
            items: [
                {
                    icon: 'Phone',
                    label: 'Phone',
                    value: '+62 812 3456 7890',
                    href: 'tel:+6281234567890',
                },
                {
                    icon: 'Mail',
                    label: 'Email',
                    value: 'hello@travelboost.com',
                    href: 'mailto:hello@travelboost.com',
                },
                {
                    icon: 'MapPin',
                    label: 'Office',
                    value: 'Jl. Sudirman No. 123, Jakarta',
                    href: '#about-us',
                },
                {
                    icon: 'Clock',
                    label: 'Hours',
                    value: 'Mon–Fri, 9am – 6pm WIB',
                    href: '',
                },
            ],
        },
        render: ({
            badge,
            header,
            description,
            columns,
            items,
            padding,
            align,
            background,
            maxWidth,
            editMode,
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
                <div
                    className={cn(
                        'grid gap-4',
                        columns === 2 && 'sm:grid-cols-2',
                        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
                        columns === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
                    )}
                >
                    {items.map((item, i) => {
                        const content = (
                            <Card className="flex items-start gap-4 border-border/60 p-5 transition hover:border-primary/30 hover:shadow-md">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                    <LucideIconRenderer
                                        name={item.icon}
                                        className="size-5 text-primary"
                                    />
                                </div>
                                <div>
                                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        {item.label}
                                    </p>
                                    <p className="mt-1 font-medium text-foreground">
                                        {item.value}
                                    </p>
                                </div>
                            </Card>
                        );

                        if (item.href && !editMode) {
                            return (
                                <a key={i} href={item.href} className="block">
                                    {content}
                                </a>
                            );
                        }

                        return <div key={i}>{content}</div>;
                    })}
                </div>
            </ContentSection>
        ),
    };
