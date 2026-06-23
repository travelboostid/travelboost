import { OptimizedImage } from '@/components/optimized-image';
import { Button } from '@/components/ui/button';
import { show as showRegister } from '@/routes/companies/register';
import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Heart,
    Mail,
    Phone,
    Rocket,
    Sparkles,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';

export function CTASection() {
    const partnerLogos = [
        {
            name: 'ASTINDO',
            src: '/images/logo/partner/astindo.png',
        },
        {
            name: 'Prismalink',
            src: '/images/logo/partner/prismalink.png',
        },
    ];

    const cards = [
        {
            icon: <Rocket className="h-8 w-8" />,
            title: 'Mulai Uji Coba Gratis Anda',
            description:
                'Daftar hari ini dan mulailah mempromosikan produk perjalanan Anda seperti seorang profesional berpengalaman.',
        },
        {
            icon: <Sparkles className="h-8 w-8" />,
            title: 'Rangkul Masa Depan',
            description:
                'Rasakan generasi berikutnya pemasaran agen perjalanan dengan platform inovatif TravelBoost.',
        },
        {
            icon: <Heart className="h-8 w-8" />,
            title: 'Klien Anda Menanti',
            description:
                'Mari bekerja sama untuk membuat setiap perjalanan tak terlupakan. Petualangan Anda berikutnya dimulai sekarang!',
        },
    ];

    return (
        <>
            <section id="get-started" className="bg-background py-20 lg:py-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <h2 className="text-balance font-georgia text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
                            Siap Meningkatkan Bisnis Perjalanan Anda?
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                            Ambil langkah pertama menuju karier yang lebih
                            sukses dan memuaskan sebagai agen perjalanan.
                        </p>
                    </div>

                    <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                        {cards.map((card) => (
                            <div
                                key={card.title}
                                className="rounded-2xl border border-border bg-card p-8 text-center"
                            >
                                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    {card.icon}
                                </div>
                                <h3 className="mb-3 font-playfair-display text-xl font-semibold text-foreground">
                                    {card.title}
                                </h3>
                                <p className="leading-relaxed text-muted-foreground">
                                    {card.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <Button
                            size="lg"
                            className="px-10 py-6 text-lg"
                            asChild
                        >
                            <Link href={showRegister()}>
                                <FormattedMessage defaultMessage="Gabung TravelBoost Sekarang" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            <section
                id="contact"
                className="bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.45)_100%)] py-20 lg:py-28"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-[32px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,247,250,0.92))] shadow-[0_28px_90px_-52px_rgba(15,23,42,0.42)]">
                        <div className="border-b border-border/60 px-6 py-10 text-center sm:px-8 lg:px-14">
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
                                Contact TravelBoost
                            </div>
                            <h2 className="mx-auto mt-4 max-w-3xl text-balance font-georgia text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
                                Hubungi tim kami untuk diskusi produk,
                                partnership, atau onboarding.
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                                TravelBoost membantu tim travel bekerja lebih
                                rapi dalam promosi, distribusi produk, dan
                                koordinasi operasional. Tim kami siap
                                mendampingi dari tahap eksplorasi hingga
                                implementasi.
                            </p>
                        </div>

                        <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
                            <div className="relative overflow-hidden bg-[linear-gradient(165deg,rgba(221,79,129,0.98),rgba(121,42,103,0.96))] px-6 py-8 text-primary-foreground sm:px-8 lg:px-10 lg:py-10">
                                <div className="absolute -bottom-20 -right-16 h-52 w-52 rounded-full bg-white/12 blur-2xl" />
                                <div className="absolute -top-14 left-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
                                <div className="relative">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-white/90">
                                        Informasi Kontak
                                    </div>
                                    <h3 className="mt-6 font-playfair-display text-2xl font-semibold sm:text-3xl">
                                        Jalur komunikasi yang jelas untuk
                                        vendor, agent, dan partner resmi.
                                    </h3>
                                    <p className="mt-4 max-w-sm text-sm leading-7 text-white/80 sm:text-base">
                                        Hubungi kami untuk diskusi presentasi
                                        produk, konsultasi operasional,
                                        kebutuhan onboarding, atau peluang
                                        kolaborasi industri.
                                    </p>

                                    <div className="mt-8 space-y-5 text-sm sm:text-base">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/14">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">
                                                    PT Erasoft Teknologi
                                                    Indonessia
                                                </p>
                                                <p className="mt-1 leading-7 text-white/78">
                                                    Jl. Alaydrus No.37,
                                                    RT.8/RW.2, Petojo Utara,
                                                    Kecamatan Gambir, Kota
                                                    Jakarta Pusat, Daerah Khusus
                                                    Ibukota Jakarta 10130
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/14">
                                                <Mail className="h-5 w-5" />
                                            </div>
                                            <a
                                                href="mailto:support@travelboost.co.id"
                                                className="text-white/90 transition-colors hover:text-white"
                                            >
                                                support@travelboost.co.id
                                            </a>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/14">
                                                <Phone className="h-5 w-5" />
                                            </div>
                                            <a
                                                href="tel:0216349318"
                                                className="text-white/90 transition-colors hover:text-white"
                                            >
                                                0216349318
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
                                        Hubungi Kami
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Respon cepat untuk kebutuhan produk,
                                        operasional, dan partner discussion.
                                    </p>
                                </div>

                                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                                        <p className="text-sm font-medium text-foreground">
                                            Product and onboarding
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            Diskusikan setup vendor, struktur
                                            product, alur sales, dan kebutuhan
                                            tim internal Anda.
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                                        <p className="text-sm font-medium text-foreground">
                                            Official partnership
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            Terbuka untuk kolaborasi asosiasi,
                                            payment partner, dan partner
                                            industri yang relevan dengan travel
                                            ecosystem.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 overflow-hidden rounded-[28px] border border-border/70 bg-foreground px-6 py-7 text-background shadow-[0_24px_90px_-52px_rgba(2,6,23,0.7)] sm:px-8">
                                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-background/70">
                                        Mulai Diskusi
                                    </p>
                                    <h3 className="mt-3 max-w-xl text-balance font-playfair-display text-2xl font-semibold">
                                        Ingin presentasi singkat, konsultasi
                                        produk, atau langsung mulai onboarding?
                                    </h3>
                                    <p className="mt-4 max-w-xl text-sm leading-7 text-background/70 sm:text-base">
                                        Tim kami akan membantu memetakan
                                        kebutuhan operasional dan promosi Anda
                                        agar setup TravelBoost terasa cepat,
                                        rapi, dan siap dipakai oleh tim.
                                    </p>
                                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                        <Button
                                            size="lg"
                                            className="h-12 bg-primary px-6 text-primary-foreground hover:bg-primary/90"
                                            asChild
                                        >
                                            <Link href={showRegister()}>
                                                <span>Mulai Sekarang</span>
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="h-12 border-background/20 bg-transparent px-6 text-background hover:bg-background/10 hover:text-background"
                                            asChild
                                        >
                                            <a href="mailto:support@travelboost.co.id">
                                                Email Support
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border/60 bg-background/70 py-6">
                            <div className="px-6 sm:px-8 lg:px-10">
                                <p className="text-center text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                                    Supported by official partners
                                </p>
                            </div>
                            <div className="relative mt-5 overflow-hidden">
                                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background/95 to-transparent" />
                                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background/95 to-transparent" />
                                <div className="flex w-max animate-[contact-marquee_18s_linear_infinite] items-center gap-4 px-4">
                                    {[
                                        ...partnerLogos,
                                        ...partnerLogos,
                                        ...partnerLogos,
                                    ].map((partner, index) => (
                                        <div
                                            key={`${partner.name}-${index}`}
                                            className="flex h-20 min-w-[220px] items-center justify-center rounded-2xl border border-border/60 bg-card px-8 shadow-sm"
                                        >
                                            <OptimizedImage
                                                src={partner.src}
                                                alt={partner.name}
                                                width={150}
                                                height={40}
                                                className="h-10 w-auto max-w-[150px] object-contain"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
