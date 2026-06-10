import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    ArrowRightIcon,
    CompassIcon,
    LayoutTemplateIcon,
    LeafIcon,
    SparklesIcon,
    SunMediumIcon,
    type LucideIcon,
} from 'lucide-react';
import greenie from './bootstraps/greenie.json';
import simple from './bootstraps/simple.json';
import warm from './bootstraps/warm.json';

type TemplateAccent = 'simple' | 'warm' | 'greenie' | 'blank';

type TravelTemplate = {
    name: string;
    tagline: string;
    description: string;
    accent: TemplateAccent;
    icon: LucideIcon;
    highlights: string[];
    data: Record<string, unknown>;
};

const TEMPLATES: TravelTemplate[] = [
    {
        name: 'Simple',
        tagline: 'Clean & focused',
        description:
            'Minimal layout that puts destinations and trip details front and center.',
        accent: 'simple',
        icon: LayoutTemplateIcon,
        highlights: ['Hero + features', 'Light theme', 'Fast to customize'],
        data: simple,
    },
    {
        name: 'Warm',
        tagline: 'Story-driven',
        description:
            'Rich, inviting sections built for culture, local experiences, and personal journeys.',
        accent: 'warm',
        icon: SunMediumIcon,
        highlights: ['Warm palette', 'Immersive sections', 'Great for tours'],
        data: warm,
    },
    {
        name: 'Greenie',
        tagline: 'Nature-first',
        description:
            'Fresh, outdoor-inspired design for eco-travel and adventure brands.',
        accent: 'greenie',
        icon: LeafIcon,
        highlights: ['Eco aesthetic', 'Hero variant', 'Adventure-ready'],
        data: greenie,
    },
    {
        name: 'Blank',
        tagline: 'Start fresh',
        description:
            'Empty canvas — drag blocks in and shape the page exactly your way.',
        accent: 'blank',
        icon: SparklesIcon,
        highlights: ['No preset content', 'Full flexibility', 'Your vision'],
        data: {},
    },
];

const accentStyles: Record<
    TemplateAccent,
    {
        card: string;
        header: string;
        iconWrap: string;
        icon: string;
        badge: string;
        button: string;
        dot: string;
    }
> = {
    simple: {
        card: 'hover:border-sky-500/40 hover:shadow-sky-500/10',
        header: 'from-sky-500/15 via-sky-500/5 to-transparent',
        iconWrap: 'bg-sky-500/15 ring-sky-500/25',
        icon: 'text-sky-600 dark:text-sky-400',
        badge: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
        button: 'group-hover:bg-sky-600 group-hover:text-white dark:group-hover:bg-sky-500',
        dot: 'bg-sky-500',
    },
    warm: {
        card: 'hover:border-amber-500/40 hover:shadow-amber-500/10',
        header: 'from-amber-500/20 via-orange-500/10 to-transparent',
        iconWrap: 'bg-amber-500/15 ring-amber-500/25',
        icon: 'text-amber-600 dark:text-amber-400',
        badge: 'border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300',
        button: 'group-hover:bg-amber-600 group-hover:text-white dark:group-hover:bg-amber-500',
        dot: 'bg-amber-500',
    },
    greenie: {
        card: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
        header: 'from-emerald-500/20 via-green-500/10 to-transparent',
        iconWrap: 'bg-emerald-500/15 ring-emerald-500/25',
        icon: 'text-emerald-600 dark:text-emerald-400',
        badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
        button: 'group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-emerald-500',
        dot: 'bg-emerald-500',
    },
    blank: {
        card: 'hover:border-violet-500/40 hover:shadow-violet-500/10',
        header: 'from-violet-500/15 via-fuchsia-500/5 to-transparent',
        iconWrap: 'bg-violet-500/15 ring-violet-500/25',
        icon: 'text-violet-600 dark:text-violet-400',
        badge: 'border-violet-500/20 bg-violet-500/10 text-violet-800 dark:text-violet-300',
        button: 'group-hover:bg-violet-600 group-hover:text-white dark:group-hover:bg-violet-500',
        dot: 'bg-violet-500',
    },
};

function TemplateCard({
    template,
    onSelected,
}: {
    template: TravelTemplate;
    onSelected: (data: Record<string, unknown>) => void;
}) {
    const styles = accentStyles[template.accent];
    const Icon = template.icon;

    return (
        <button
            type="button"
            onClick={() => onSelected(template.data)}
            className={cn(
                'group flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
                styles.card,
            )}
        >
            <div
                className={cn(
                    'relative flex flex-col gap-4 bg-linear-to-br px-5 pt-5 pb-4',
                    styles.header,
                )}
            >
                <div className="flex items-start justify-between gap-3">
                    <div
                        className={cn(
                            'flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1',
                            styles.iconWrap,
                        )}
                    >
                        <Icon className={cn('size-6', styles.icon)} />
                    </div>
                    <Badge
                        variant="outline"
                        className={cn(
                            'shrink-0 text-[10px] font-semibold uppercase tracking-wider',
                            styles.badge,
                        )}
                    >
                        {template.tagline}
                    </Badge>
                </div>
                <div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                        {template.name}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {template.description}
                    </p>
                </div>
            </div>

            <ul className="flex flex-1 flex-col gap-2 px-5 py-4">
                {template.highlights.map((highlight) => (
                    <li
                        key={highlight}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                        <span
                            className={cn(
                                'size-1.5 shrink-0 rounded-full',
                                styles.dot,
                            )}
                        />
                        {highlight}
                    </li>
                ))}
            </ul>

            <div className="border-t bg-muted/20 px-5 py-4">
                <span
                    className={cn(
                        'inline-flex w-full items-center justify-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium transition-colors',
                        styles.button,
                    )}
                >
                    Use this template
                    <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
            </div>
        </button>
    );
}

export default function SelectTemplate({
    onSelected,
}: {
    onSelected: (data: Record<string, unknown>) => void;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-6xl px-6 py-16">
                <div className="mb-14 space-y-4 text-center">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                        <CompassIcon className="size-7" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">
                        Choose Your Travel Template
                    </h1>
                    <p className="mx-auto max-w-2xl text-muted-foreground">
                        Start building your travel landing page. Pick a design
                        that matches your destination style and brand
                        personality.
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                    {TEMPLATES.map((template) => (
                        <TemplateCard
                            key={template.name}
                            template={template}
                            onSelected={onSelected}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
