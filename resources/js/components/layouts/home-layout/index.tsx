import type { ReactNode } from 'react';
import { Footer } from './footer';
import { Header } from './header';

type HomeLayoutProps = {
  children: ReactNode;
};

export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
