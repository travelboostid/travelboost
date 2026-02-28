import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Fragment } from 'react';

export type BreadcrumbItemInfo = {
  title: string;
  url?: string;
};

export type BreadcrumbRendererProps = {
  breadcrumb?: BreadcrumbItemInfo[];
};

export default function BreadcrumbRenderer({
  breadcrumb,
}: BreadcrumbRendererProps) {
  if (!breadcrumb) return null;
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumb.map((b, index) => {
          // Add separator before all items except the first one
          const shouldAddSeparator = index > 0;

          return (
            <Fragment key={index}>
              {shouldAddSeparator && (
                <BreadcrumbSeparator className="hidden md:block" />
              )}
              <BreadcrumbItem className="hidden md:block">
                {b.url ? (
                  <BreadcrumbLink href={b.url}>{b.title || '-'}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{b.title || '-'}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
