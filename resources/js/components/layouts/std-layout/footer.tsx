import { Link } from '@inertiajs/react';
import { Building2, Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-foreground py-16 text-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
                    <div>
                        <Link href="/" className="mb-6 inline-flex">
                            <img
                                src="/images/logo/hori-wt.png"
                                alt="TravelBoost"
                                className="h-12 w-auto object-contain"
                            />
                        </Link>
                        <p className="text-sm leading-relaxed text-background/70">
                            Platform promosi agen perjalanan untuk membantu
                            vendor dan agent mengelola distribusi produk,
                            momentum promosi, dan komunikasi bisnis dengan lebih
                            rapi.
                        </p>
                        <div className="mt-6 flex items-start gap-3 text-sm text-background/70">
                            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <div>
                                <p className="font-medium text-background">
                                    PT Erasoft Teknologi Indonessia
                                </p>
                                <p className="mt-1 leading-relaxed">
                                    Jl. Alaydrus No.37, RT.8/RW.2, Petojo Utara,
                                    Kecamatan Gambir, Kota Jakarta Pusat, Daerah
                                    Khusus Ibukota Jakarta 10130
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-4 font-semibold">Navigation</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/#features"
                                    className="text-sm text-background/70 transition-colors hover:text-background"
                                >
                                    Fitur
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#benefits"
                                    className="text-sm text-background/70 transition-colors hover:text-background"
                                >
                                    Benefits
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#testimonials"
                                    className="text-sm text-background/70 transition-colors hover:text-background"
                                >
                                    Testimonials
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/pricing"
                                    className="text-sm text-background/70 transition-colors hover:text-background"
                                >
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#get-started"
                                    className="text-sm text-background/70 transition-colors hover:text-background"
                                >
                                    Get Started
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#contact"
                                    className="text-sm text-background/70 transition-colors hover:text-background"
                                >
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/docs"
                                    className="text-sm text-background/70 transition-colors hover:text-background"
                                >
                                    Dokumentasi
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 font-semibold">Support</h3>
                        <div className="space-y-4">
                            <a
                                href="mailto:support@travelboost.co.id"
                                className="flex items-center gap-3 text-sm text-background/70 transition-colors hover:text-background"
                            >
                                <Mail className="h-4 w-4 text-primary" />
                                <span>support@travelboost.co.id</span>
                            </a>
                            <a
                                href="tel:0216349318"
                                className="flex items-center gap-3 text-sm text-background/70 transition-colors hover:text-background"
                            >
                                <Phone className="h-4 w-4 text-primary" />
                                <span>0216349318</span>
                            </a>
                            <div className="flex items-start gap-3 text-sm text-background/70">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <p>
                                    Dukungan untuk diskusi produk, onboarding,
                                    dan partnership tersedia melalui email dan
                                    telepon pada jam kerja.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-background/15 bg-background/[0.04] p-4">
                                <p className="text-xs uppercase tracking-[0.22em] text-background/50">
                                    Supported by
                                </p>
                                <div className="mt-4 flex flex-wrap items-center gap-6">
                                    <img
                                        src="/images/logo/partner/astindo.png"
                                        alt="ASTINDO"
                                        className="h-9 w-auto object-contain"
                                    />
                                    <img
                                        src="/images/logo/partner/prismalink.png"
                                        alt="Prismalink"
                                        className="h-8 w-auto object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 border-t border-background/20 pt-8">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                                <Link
                                    href="/privacy"
                                    className="text-sm text-background/70 transition-colors hover:text-background"
                                >
                                    Kebijakan Privasi
                                </Link>
                                <Link
                                    href="/terms-and-conditions"
                                    className="text-sm text-background/70 transition-colors hover:text-background"
                                >
                                    Syarat & Ketentuan
                                </Link>
                                <Link
                                    href="/cookie-policy"
                                    className="text-sm text-background/70 transition-colors hover:text-background"
                                >
                                    Kebijakan Cookie
                                </Link>
                                <Link
                                    href="/docs"
                                    className="text-sm text-background/70 transition-colors hover:text-background"
                                >
                                    Dokumentasi
                                </Link>
                            </div>
                            <p className="text-sm text-background/70">
                                Copyright 2026 TravelBoost. All rights reserved.
                            </p>
                        </div>

                        <div className="flex items-center gap-6">
                            <Link
                                href="#"
                                className="text-sm text-background/70 transition-colors hover:text-background"
                            >
                                Instagram
                            </Link>
                            <Link
                                href="#"
                                className="text-sm text-background/70 transition-colors hover:text-background"
                            >
                                Facebook
                            </Link>
                            <Link
                                href="#"
                                className="text-sm text-background/70 transition-colors hover:text-background"
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
