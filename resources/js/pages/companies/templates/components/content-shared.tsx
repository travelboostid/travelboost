import type { Fields } from '@puckeditor/core';
import type { ReactNode } from 'react';
import {
    SectionHeader,
    sectionContainerClass,
    sectionHeaderFields,
    sectionInnerClass,
    sectionStyleDefaults,
    sectionStyleFields,
    type SectionAlign,
    type SectionBackground,
    type SectionMaxWidth,
    type SectionPadding,
} from './section-styles';

export type ContentStyleProps = {
    padding: SectionPadding;
    align: SectionAlign;
    background: SectionBackground;
    maxWidth: SectionMaxWidth;
};

export const contentStyleDefaults: ContentStyleProps = {
    ...sectionStyleDefaults,
};

export const contentStyleFields = sectionStyleFields;

export function contentHeaderFields(): Fields<{
    badge: string;
    header: string;
    description: string;
}> {
    return sectionHeaderFields();
}

export function ContentSection({
    badge,
    header,
    description,
    align,
    padding,
    background,
    maxWidth,
    inverted,
    children,
    className,
}: ContentStyleProps & {
    badge?: string;
    header?: string;
    description?: string;
    inverted?: boolean;
    children: ReactNode;
    className?: string;
}) {
    const hasHeader = badge || header || description;

    return (
        <section
            className={sectionContainerClass({
                padding,
                background,
                className,
            })}
        >
            <div className={sectionInnerClass(maxWidth)}>
                {hasHeader && (
                    <SectionHeader
                        badge={badge}
                        header={header}
                        description={description}
                        align={align}
                        inverted={inverted}
                    />
                )}
                {children}
            </div>
        </section>
    );
}
