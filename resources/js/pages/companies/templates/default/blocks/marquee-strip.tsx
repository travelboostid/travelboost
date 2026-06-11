import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import {
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';

export type MarqueeStripComponentProps = ContentStyleProps & {
    items: { text: string }[];
    speed: 'slow' | 'normal' | 'fast';
    style: 'text' | 'pill';
    separator: string;
};

const speedClass = {
    slow: '[animation-duration:40s]',
    normal: '[animation-duration:25s]',
    fast: '[animation-duration:15s]',
};

export const MarqueeStripComponentConfig: ComponentConfig<MarqueeStripComponentProps> =
    {
        label: 'Marquee Strip',
        fields: {
            ...contentStyleFields,
            speed: {
                type: 'select',
                label: 'Speed',
                options: [
                    { value: 'slow', label: 'Slow' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'fast', label: 'Fast' },
                ],
            },
            style: {
                type: 'select',
                label: 'Style',
                options: [
                    { value: 'text', label: 'Bold Text' },
                    { value: 'pill', label: 'Pill Tags' },
                ],
            },
            separator: { type: 'text', label: 'Separator' },
            items: {
                type: 'array',
                label: 'Items',
                max: 20,
                arrayFields: {
                    text: {
                        type: 'text',
                        label: 'Text',
                        contentEditable: true,
                    },
                },
                getItemSummary: (item) => item.text || 'Item',
            },
        } as ComponentConfig<MarqueeStripComponentProps>['fields'],
        defaultProps: {
            ...contentStyleDefaults,
            padding: 'sm',
            background: 'primary',
            items: [
                { text: 'Bali' },
                { text: 'Tokyo' },
                { text: 'Paris' },
                { text: 'Swiss Alps' },
                { text: 'Santorini' },
                { text: 'New York' },
                { text: 'Dubai' },
                { text: 'Maldives' },
            ],
            speed: 'normal',
            style: 'text',
            separator: '✦',
        },
        render: ({ items, speed, style, separator, padding, background }) => {
            const doubled = [...items, ...items];

            return (
                <section
                    className={cn(
                        'overflow-hidden py-6 text-primary-foreground',
                        background === 'primary' && 'bg-primary',
                        background === 'muted' && 'bg-muted text-foreground',
                        background === 'gradient' &&
                            'bg-linear-to-r from-primary via-primary/90 to-secondary text-primary-foreground',
                        padding === 'none' && 'py-4',
                        padding === 'lg' && 'py-10',
                    )}
                >
                    <div
                        className={cn(
                            'flex w-max animate-[puck-marquee-text_linear_infinite] gap-8 hover:[animation-play-state:paused]',
                            speedClass[speed],
                        )}
                    >
                        {doubled.map((item, i) => (
                            <span
                                key={i}
                                className="flex shrink-0 items-center gap-8"
                            >
                                {style === 'pill' ? (
                                    <span className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium backdrop-blur-sm">
                                        {item.text}
                                    </span>
                                ) : (
                                    <span className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                                        {item.text}
                                    </span>
                                )}
                                <span className="text-xl opacity-40">
                                    {separator}
                                </span>
                            </span>
                        ))}
                    </div>
                </section>
            );
        },
    };
