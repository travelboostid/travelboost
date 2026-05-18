import AnonymousUserContextProvider from '@/components/anonymous-user-context-provider';
import type { ReactNode } from 'react';
import Inner from './inner';

export type TenantLayoutProps = {
  children: ReactNode;
  onNavigateAway?: (href: string) => void;
};

export default function TenantLayout(props: TenantLayoutProps) {
  return (
    <AnonymousUserContextProvider>
      <Inner {...props} />
    </AnonymousUserContextProvider>
  );
}
