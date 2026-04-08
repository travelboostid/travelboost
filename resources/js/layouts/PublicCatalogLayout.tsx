import { TooltipProvider } from '@/components/ui/tooltip';

import AnonymousUserContextProvider from '@/components/anonymous-user-context-provider';
import PublicCatalogLayoutInner from './public-catalog-layout-inner';

export type PublicCatalogLayoutProps = {
  children: React.ReactNode;
};

export default function PublicCatalogLayout(props: PublicCatalogLayoutProps) {
  return (
    <TooltipProvider>
      <AnonymousUserContextProvider>
        <PublicCatalogLayoutInner {...props} />
      </AnonymousUserContextProvider>
    </TooltipProvider>
  );
}
