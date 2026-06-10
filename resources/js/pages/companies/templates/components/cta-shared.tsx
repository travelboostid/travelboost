import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import type { LinkButtonComponentProps } from '../base/blocks/link-button';
import { linkButtonActionsField } from './fields';
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
} from './section-styles';

export type CtaStyleProps = {
    padding: SectionPadding;
    align: SectionAlign;
    background: SectionBackground;
    maxWidth: SectionMaxWidth;
};

export const ctaStyleDefaults: CtaStyleProps = {
    ...sectionStyleDefaults,
    background: 'primary',
    align: 'center',
};

export const ctaStyleFields = sectionStyleFields;

export const ctaContentFields = {
    ...sectionHeaderFields(),
    actions: linkButtonActionsField('Buttons', 3),
};

export const defaultCtaActions: LinkButtonComponentProps[] = [
    {
        variant: 'secondary',
        label: 'Start Your Journey',
        size: 'lg',
        disabled: false,
        className: '',
        type: 'button',
        href: '/tours',
        target: '_self',
    },
    {
        variant: 'outline',
        label: 'Contact Us',
        size: 'lg',
        disabled: false,
        className:
            'border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10',
        type: 'button',
        href: '/tours',
        target: '_self',
    },
];

export function CtaActions({
    actions,
    align,
    editMode,
    className,
}: {
    actions: LinkButtonComponentProps[];
    align: SectionAlign;
    editMode?: boolean;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-wrap gap-3',
                align === 'center' && 'justify-center',
                align === 'right' && 'justify-end',
                className,
            )}
        >
            {actions.map(({ label, target, href, ...buttonProps }, i) =>
                editMode ? (
                    <Button key={i} {...buttonProps}>
                        {label}
                    </Button>
                ) : (
                    <Button key={i} {...buttonProps} asChild>
                        <Link href={href} target={target}>
                            {label}
                        </Link>
                    </Button>
                ),
            )}
        </div>
    );
}

export function CtaSectionHeader({
    badge,
    header,
    description,
    align,
    inverted,
}: {
    badge?: string;
    header: string;
    description?: string;
    align: SectionAlign;
    inverted?: boolean;
}) {
    return (
        <SectionHeader
            badge={badge}
            header={header}
            description={description}
            align={align}
            inverted={inverted}
            className="mb-0"
        />
    );
}

export function ctaShellClass(style: CtaStyleProps, extra?: string): string {
    return cn(sectionContainerClass(style), extra);
}

export function ctaInnerClass(maxWidth: SectionMaxWidth): string {
    return sectionInnerClass(maxWidth);
}

export function isCtaInverted(background: SectionBackground): boolean {
    return background === 'primary';
}
