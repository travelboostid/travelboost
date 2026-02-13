import { useState } from "react";
import { Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Menu, X, Plane } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between h-16">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Plane className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              TravelBoost
            </span>
          </Link>

          {/* DESKTOP MENU */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Fitur
            </a>
            <a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors">
              Keunggulan
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Testimoni
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Kontak
            </a>
          </nav>

          {/* DESKTOP BUTTON */}
          <div className="hidden md:flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Daftar Gratis</Link>
            </Button>
          </div>

          {/* MOBILE TOGGLE */}
          <button
            type="button"
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* MOBILE MENU */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <a href="#features" className="text-muted-foreground hover:text-foreground">
                Fitur
              </a>
              <a href="#benefits" className="text-muted-foreground hover:text-foreground">
                Keunggulan
              </a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground">
                Testimoni
              </a>
              <a href="#contact" className="text-muted-foreground hover:text-foreground">
                Kontak
              </a>

              <div className="flex flex-col gap-2 pt-4">
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/login">Masuk</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/register">Daftar Gratis</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
