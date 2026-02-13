//import Link from "next/link";
import { Link } from '@inertiajs/react'
import { Plane } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Plane className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">TravelBoost</span>
            </Link>
            <p className="text-background/70 text-sm leading-relaxed">
              Platform promosi agen perjalanan terbaik untuk memberdayakan
              bisnis Anda.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Produk</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Fitur
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Harga
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Integrasi
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Perusahaan</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Karir
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Kontak
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Kebijakan Cookie
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/70 text-sm">
              © 2026 TravelBoost. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="#"
                className="text-background/70 hover:text-background transition-colors text-sm"
              >
                Instagram
              </Link>
              <Link
                href="#"
                className="text-background/70 hover:text-background transition-colors text-sm"
              >
                Facebook
              </Link>
              <Link
                href="#"
                className="text-background/70 hover:text-background transition-colors text-sm"
              >
                LinkedIn
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
