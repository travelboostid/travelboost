import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import {
    ContentSection,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';

export type QuoteBlockComponentProps = ContentStyleProps & {
    quote: string;
    author: string;
    role: string;
    style: 'simple' | 'card' | 'large';
};

export const QuoteBlockComponentConfig: ComponentConfig<QuoteBlockComponentProps> =
    {
        label: 'Quote Block',
        fields: {
            quote: {
                type: 'textarea',
                label: 'Quote',
                contentEditable: true,
            },
            author: { type: 'text', label: 'Author', contentEditable: true },
            role: {
                type: 'text',
                label: 'Role / Title',
                contentEditable: true,
            },
            style: {
                type: 'select',
                label: 'Style',
                options: [
                    { value: 'simple', label: 'Simple' },
                    { value: 'card', label: 'Card' },
                    { value: 'large', label: 'Large Featured' },
                ],
            },
            ...contentStyleFields,
        } as ComponentConfig<QuoteBlockComponentProps>['fields'],
        defaultProps: {
            quote: 'Travel is the only thing you buy that makes you richer. Every journey with this team has been absolutely transformative.',
            author: 'Maria Santos',
            role: 'Traveler since 2019',
            style: 'card',
            ...contentStyleDefaults,
            padding: 'lg',
            background: 'gradient',
            align: 'center',
        },
        render: ({
            quote,
            author,
            role,
            style,
            padding,
            align,
            background,
            maxWidth,
        }) => (
            <ContentSection
                padding={padding}
                background={background}
                maxWidth={maxWidth}
                align={align}
            >
                <blockquote
                    className={cn(
                        'mx-auto max-w-3xl',
                        style === 'card' &&
                            'rounded-2xl border border-border/60 bg-card p-8 shadow-sm md:p-10',
                        style === 'large' && 'max-w-4xl',
                        align === 'center' && 'text-center',
                        align === 'right' && 'text-right',
                    )}
                >
                    <p
                        className={cn(
                            'leading-relaxed text-foreground',
                            style === 'large'
                                ? 'text-2xl font-light md:text-3xl lg:text-4xl'
                                : 'text-xl md:text-2xl',
                        )}
                    >
                        &ldquo;{quote}&rdquo;
                    </p>
                    {(author || role) && (
                        <footer className="mt-6">
                            {author && (
                                <cite className="not-italic font-semibold text-foreground">
                                    {author}
                                </cite>
                            )}
                            {role && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {role}
                                </p>
                            )}
                        </footer>
                    )}
                </blockquote>
            </ContentSection>
        ),
    };
