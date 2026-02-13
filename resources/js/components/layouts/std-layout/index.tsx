import type { ReactNode } from 'react';
import { Footer } from 'react-day-picker';
import { Header } from './header';

type StdLayoutProps = {
  children: ReactNode;
};

export default function StdLayout({ children }: StdLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
