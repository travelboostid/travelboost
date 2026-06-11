import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import { MapPinIcon } from 'lucide-react';
import {
    ContentSection,
    contentHeaderFields,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';

export type MapPin = {
    name: string;
    tours: string;
    x: number;
    y: number;
};

export type LocationMapComponentProps = ContentStyleProps & {
    badge: string;
    header: string;
    description: string;
    pins: MapPin[];
    mapStyle: 'light' | 'dark' | 'blue';
};

const mapBg = {
    light: 'bg-linear-to-br from-muted via-background to-muted',
    dark: 'bg-linear-to-br from-slate-900 via-slate-800 to-slate-900',
    blue: 'bg-linear-to-br from-sky-100 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900',
};

export const LocationMapComponentConfig: ComponentConfig<LocationMapComponentProps> =
    {
        label: 'Location Map',
        fields: {
            ...contentHeaderFields(),
            ...contentStyleFields,
            mapStyle: {
                type: 'select',
                label: 'Map Style',
                options: [
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'blue', label: 'Ocean Blue' },
                ],
            },
            pins: {
                type: 'array',
                label: 'Location Pins',
                max: 8,
                arrayFields: {
                    name: {
                        type: 'text',
                        label: 'Name',
                        contentEditable: true,
                    },
                    tours: {
                        type: 'text',
                        label: 'Tour Count',
                        contentEditable: true,
                    },
                    x: {
                        type: 'number',
                        label: 'Position X (%)',
                        min: 5,
                        max: 95,
                    },
                    y: {
                        type: 'number',
                        label: 'Position Y (%)',
                        min: 5,
                        max: 95,
                    },
                },
                getItemSummary: (item) => item.name || 'Pin',
            },
        } as ComponentConfig<LocationMapComponentProps>['fields'],
        defaultProps: {
            badge: 'Global Reach',
            header: 'Where We Take You',
            description:
                'Explore our most popular destinations across the globe',
            ...contentStyleDefaults,
            background: 'none',
            mapStyle: 'blue',
            pins: [
                { name: 'Paris', tours: '24 tours', x: 48, y: 28 },
                { name: 'Tokyo', tours: '18 tours', x: 82, y: 35 },
                { name: 'New York', tours: '31 tours', x: 22, y: 32 },
                { name: 'Bali', tours: '15 tours', x: 78, y: 62 },
                { name: 'Cape Town', tours: '12 tours', x: 52, y: 72 },
            ],
        },
        render: ({
            badge,
            header,
            description,
            pins,
            mapStyle,
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
                <div
                    className={cn(
                        'relative aspect-[2/1] overflow-hidden rounded-3xl border border-border/60 shadow-xl md:aspect-[21/9]',
                        mapBg[mapStyle],
                    )}
                >
                    <div className="absolute inset-0 opacity-30">
                        <svg
                            className="size-full"
                            viewBox="0 0 100 50"
                            preserveAspectRatio="none"
                        >
                            <pattern
                                id="grid"
                                width="4"
                                height="4"
                                patternUnits="userSpaceOnUse"
                            >
                                <circle
                                    cx="1"
                                    cy="1"
                                    r="0.3"
                                    fill="currentColor"
                                />
                            </pattern>
                            <rect width="100" height="50" fill="url(#grid)" />
                        </svg>
                    </div>
                    {pins.map((pin, i) => (
                        <div
                            key={i}
                            className="group absolute -translate-x-1/2 -translate-y-full"
                            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                        >
                            <div className="relative">
                                <span className="absolute -inset-2 animate-ping rounded-full bg-primary/30 opacity-75" />
                                <MapPinIcon className="relative size-8 fill-primary text-primary drop-shadow-lg transition group-hover:scale-125" />
                            </div>
                            <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-background/95 px-3 py-2 text-sm shadow-lg opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                                <p className="font-semibold text-foreground">
                                    {pin.name}
                                </p>
                                <Badge variant="secondary" className="mt-1">
                                    {pin.tours}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </ContentSection>
        ),
    };
