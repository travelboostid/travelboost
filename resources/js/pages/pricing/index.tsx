import StdLayout from '@/components/layouts/std-layout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { show as showRegister } from '@/routes/companies/register';
import { Link } from '@inertiajs/react';
import { BotIcon, CheckIcon, SparklesIcon } from 'lucide-react';

const CHAT_AI_INTERACTION_COST = 75;
const CHAT_AI_FREE_CREDITS = 50_000;
const BASIC_SUBSCRIPTION_AI_CREDITS = 200_000;
const CHAT_AI_FREE_INTERACTIONS = Math.floor(
    CHAT_AI_FREE_CREDITS / CHAT_AI_INTERACTION_COST,
);

type PricingPlan = {
    name: string;
    price: string;
    period: string;
    description: string;
    featured: boolean;
    featuredLabel: string;
    features: string[];
    actionLabel: string;
    actionHref: string;
};

const PLANS: PricingPlan[] = [
    {
        name: 'Free Trial 1 Month',
        price: 'Rp 0',
        period: '/1 bulan',
        description:
            'Coba platform TravelBoost tanpa biaya dan mulai promosikan produk travel Anda.',
        featured: false,
        featuredLabel: 'Mulai Gratis',
        features: [
            'Akses dashboard Agent',
            'Katalog Tour dari Vendor',
            'Manajemen booking dasar',
            `Free AI credits Rp ${CHAT_AI_FREE_CREDITS.toLocaleString('id-ID')} untuk Chat AI`,
            'Dukungan onboarding',
        ],
        actionLabel: 'Mulai Uji Coba',
        actionHref: showRegister(),
    },
    {
        name: 'Basic Subscription',
        price: 'Rp 6.000.000',
        period: '/12 bulan',
        description:
            'Paket lengkap untuk Agent yang siap menjalankan operasional dan penjualan secara profesional.',
        featured: true,
        featuredLabel: 'Paling Populer',
        features: [
            'Semua fitur Free Trial',
            'Subscription aktif 12 bulan',
            'Landing page yang dapat disesuaikan',
            `Free AI credits Rp ${BASIC_SUBSCRIPTION_AI_CREDITS.toLocaleString('id-ID')} untuk Chat AI`,
            'Akses Vendor catalog & commission tools',
            'Manajemen booking yang lebih lengkap',
            'Analytics & laporan penjualan',
            'Payment gateway & wallet',
            'Priority support',
        ],
        actionLabel: 'Daftar Sekarang',
        actionHref: showRegister(),
    },
];

const CHAT_AI_FEATURES = [
    'Chatbot AI untuk landing page dan live chat',
    'Jawaban otomatis berbasis knowledge base Tour Anda',
    'Biaya flat per interaction, tanpa hitungan token',
    'Top-up AI credits kapan saja (mulai Rp 100.000)',
    'Saldo credit tampil real-time di dashboard Chatbot',
];

const PLATFORM_FEES = [
    {
        title: 'Platform fee per booking',
        value: 'Rp 25.000',
        detail: 'Dikenakan per pax pada setiap transaksi booking yang diproses melalui platform.',
    },
    {
        title: 'Wallet top-up',
        value: 'Fleksibel',
        detail: 'Top-up saldo wallet untuk commission, settlement, dan alur pembayaran internal.',
    },
];

export default function Pricing() {
    return (
        <StdLayout>
            <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                <div className="mb-16 text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
                        Pricing
                    </div>
                    <h1 className="mb-6 text-5xl font-bold text-balance text-foreground md:text-6xl">
                        Paket <span className="text-primary">TravelBoost</span>
                    </h1>
                    <p className="mx-auto max-w-3xl text-xl text-foreground/70">
                        Pilih Subscription yang sesuai untuk bisnis Agent Anda.
                        Mulai dengan uji coba gratis, lalu upgrade saat siap
                        berkembang.
                    </p>
                </div>

                <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
                    {PLANS.map((plan) => (
                        <Card
                            key={plan.name}
                            className={cn(
                                'relative flex flex-col transition duration-300',
                                plan.featured
                                    ? 'z-10 border-primary shadow-xl ring-2 ring-primary/20'
                                    : 'border-border/60 hover:-translate-y-1 hover:shadow-lg',
                            )}
                        >
                            {plan.featured ? (
                                <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-md">
                                    <SparklesIcon className="size-3" />
                                    {plan.featuredLabel}
                                </span>
                            ) : null}

                            <CardHeader className="pb-4 text-center">
                                <CardTitle className="text-xl">
                                    {plan.name}
                                </CardTitle>
                                <div className="mt-4 flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-bold tracking-tight text-foreground">
                                        {plan.price}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {plan.period}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                    {plan.description}
                                </p>
                            </CardHeader>

                            <CardContent className="flex-1 border-t border-border/50 pt-6">
                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex items-start gap-3 text-sm"
                                        >
                                            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                                <CheckIcon className="size-3 text-primary" />
                                            </span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter className="pt-2 pb-6">
                                <Button
                                    asChild
                                    className="w-full"
                                    size="lg"
                                    variant={
                                        plan.featured ? 'default' : 'outline'
                                    }
                                >
                                    <Link href={plan.actionHref}>
                                        {plan.actionLabel}
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>

            <section className="border-t border-border bg-muted/30 py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
                            Chat AI
                        </div>
                        <h2 className="mb-4 text-4xl font-bold text-foreground">
                            Harga Chatbot AI
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-foreground/70">
                            Aktifkan asisten AI untuk menjawab pertanyaan
                            pelanggan. Bayar per interaction dengan free credits
                            saat akun baru dibuat.
                        </p>
                    </div>

                    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <Card className="border-primary/30 shadow-lg ring-1 ring-primary/15">
                            <CardHeader className="gap-4 border-b pb-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                                        <BotIcon className="size-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl">
                                            Pay per interaction
                                        </CardTitle>
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                            Setiap respons Chat AI memotong
                                            saldo credit sesuai tarif flat di
                                            bawah ini.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-baseline gap-2">
                                    <span className="text-5xl font-bold tracking-tight text-foreground">
                                        Rp {CHAT_AI_INTERACTION_COST}
                                    </span>
                                    <span className="text-lg text-muted-foreground">
                                        / interaction
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ul className="space-y-3">
                                    {CHAT_AI_FEATURES.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex items-start gap-3 text-sm"
                                        >
                                            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                                <CheckIcon className="size-3 text-primary" />
                                            </span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-6">
                            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                                <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                                    New user bonus
                                </p>
                                <p className="mt-3 text-3xl font-bold text-foreground">
                                    Rp{' '}
                                    {CHAT_AI_FREE_CREDITS.toLocaleString(
                                        'id-ID',
                                    )}{' '}
                                    free credits
                                </p>
                                <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                                    Setiap akun Agent baru mendapat saldo AI
                                    credit gratis untuk mencoba Chatbot. Cukup
                                    untuk sekitar{' '}
                                    {CHAT_AI_FREE_INTERACTIONS.toLocaleString(
                                        'id-ID',
                                    )}{' '}
                                    interaction pertama.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-border bg-card p-6">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Setelah free credits habis
                                </p>
                                <p className="mt-2 text-2xl font-bold text-foreground">
                                    Top-up pay as you go
                                </p>
                                <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                                    Isi ulang AI credits dari dashboard Chatbot
                                    kapan saja. Minimum top-up Rp 100.000 via
                                    Online Payment.
                                </p>
                                <Button
                                    asChild
                                    className="mt-5 w-full"
                                    variant="outline"
                                >
                                    <Link href={showRegister()}>
                                        Daftar & coba Chat AI
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-t border-border py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-4xl font-bold text-foreground">
                            Biaya Transaksi Platform
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-foreground/70">
                            Selain Subscription dan Chat AI, beberapa layanan
                            operasional menggunakan skema biaya transaksi yang
                            transparan.
                        </p>
                    </div>

                    <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
                        {PLATFORM_FEES.map((fee) => (
                            <div
                                key={fee.title}
                                className="rounded-2xl border border-border bg-card p-6"
                            >
                                <p className="text-sm font-medium text-muted-foreground">
                                    {fee.title}
                                </p>
                                <p className="mt-2 text-2xl font-bold text-foreground">
                                    {fee.value}
                                </p>
                                <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                                    {fee.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-12 text-center">
                    <h2 className="mb-6 text-4xl font-bold text-foreground">
                        Butuh rekomendasi paket?
                    </h2>
                    <p className="mx-auto mb-8 max-w-2xl text-lg text-foreground/70">
                        Tim kami siap membantu memilih Subscription dan setup
                        operasional yang paling sesuai dengan skala bisnis
                        travel Anda.
                    </p>
                    <div className="flex flex-col justify-center gap-3 sm:flex-row">
                        <Button
                            asChild
                            size="lg"
                            className="bg-primary hover:bg-primary/90"
                        >
                            <Link href="/contact">Hubungi Kami</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link href="/learn-more">Lihat Fitur Platform</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </StdLayout>
    );
}
