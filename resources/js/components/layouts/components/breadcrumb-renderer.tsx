import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Fragment, type MouseEvent } from 'react';

export type BreadcrumbItemInfo = {
    title: string;
    url?: string;
};

export type BreadcrumbRendererProps = {
    breadcrumb?: BreadcrumbItemInfo[];
    onNavigateAway?: (href: string) => void;
};

export default function BreadcrumbRenderer({
    breadcrumb,
    onNavigateAway,
}: BreadcrumbRendererProps) {
    if (!breadcrumb) return null;

    const handleLinkClick = (
        event: MouseEvent<HTMLAnchorElement>,
        href: string,
    ) => {
        if (
            !onNavigateAway ||
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        event.preventDefault();
        onNavigateAway(href);
    };

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {breadcrumb.map((b, index) => {
                    // Add separator before all items except the first one
                    const shouldAddSeparator = index > 0;
                    const href = b.url;

                    return (
                        <Fragment key={index}>
                            {shouldAddSeparator && (
                                <BreadcrumbSeparator className="hidden md:block" />
                            )}
                            <BreadcrumbItem className="hidden md:block">
                                {href ? (
                                    <BreadcrumbLink
                                        href={href}
                                        onClick={(event) =>
                                            handleLinkClick(event, href)
                                        }
                                    >
                                        {b.title || '-'}
                                    </BreadcrumbLink>
                                ) : (
                                    <BreadcrumbPage>
                                        {b.title || '-'}
                                    </BreadcrumbPage>
                                )}
                            </BreadcrumbItem>
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
