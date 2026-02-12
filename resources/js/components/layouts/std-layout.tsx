import type { ReactNode } from 'react';
import { StdNavbar } from './std-navbar';

type StdLayoutProps = {
  children: ReactNode;
};

export default function StdLayout({ children }: StdLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <StdNavbar />
      <main className="container mx-auto">{children}</main>
    </div>
  );
}
