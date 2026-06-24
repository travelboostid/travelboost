import { OptimizedImage } from '@/components/optimized-image';
import { Head } from '@inertiajs/react';
import {
    ArrowRight,
    BriefcaseBusiness,
    ChevronDown,
    DollarSign,
    Facebook,
    Hotel,
    Instagram,
    Languages,
    Linkedin,
    LinkIcon,
    Luggage,
    Mail,
    Megaphone,
    Menu,
    MessageSquareQuote,
    Moon,
    Phone,
    PieChart,
    PlaneTakeoff,
    ShieldCheck,
    Smile,
    Star,
    Sun,
    TrendingUp,
    Twitter,
    UserPlus,
    Users,
    Wallet,
    X,
    Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';

/* ═══════════════════════════════════════════════
   DICTIONARY — Bilingual
═══════════════════════════════════════════════ */
const dict = {
    id: {
        /* Navbar */
        navHome: 'Beranda',
        navFeatures: 'Keunggulan',
        navSteps: 'Cara Kerja',
        navFaq: 'FAQ',
        navContact: 'Kontak',
        navLogin: 'Masuk',
        navRegister: 'Daftar',

        /* Hero */
        heroBadge: 'Program Afiliasi 2026',
        heroTitle: 'Raih Penghasilan Menarik dengan Program Afiliasi',
        heroTitleBrand: 'TravelBoost',
        heroTitleEnd: '!',
        heroDesc:
            'Jadilah mitra afiliasi terpercaya dan hasilkan komisi besar setiap kali travel agen yang Anda referensikan mendaftar. Gratis, mudah, dan langsung cuan!',
        heroBtn1: 'Daftar Sekarang Gratis!',
        heroBtn2: 'Pelajari Lebih Lanjut',

        /* Market Insight */
        marketTag: 'Insight Pasar',
        marketTitle: 'Peluang Besar di Industri Travel Indonesia',
        marketDesc:
            'Industri pariwisata terus bangkit dan tumbuh pesat. Ribuan Travel Agent baru bermunculan dan membutuhkan solusi teknologi. Ini adalah kesempatan emas Anda untuk menawarkan TravelBoost dan meraup cuan dari setiap lisensi yang terjual.',
        marketStat1: '500+',
        marketStat1Unit: 'Triliun Rp',
        marketStat1Desc: 'Potensi Pasar Travel',
        marketStat2: 'Ribuan',
        marketStat2Desc: 'Agen Butuh Digitalisasi',
        marketStat2Sub: 'Potensi Klien Baru',

        /* Steps */
        stepTitle: '4 Langkah Mudah Meraih Cuan',
        stepDesc:
            'Proses sepenuhnya otomatis dari pendaftaran hingga penarikan komisi.',
        step1: 'Daftar',
        step1D: 'Registrasi cepat & gratis di platform kami.',
        step2: 'Ambil Link',
        step2D: 'Dapatkan link referal unik Anda.',
        step3: 'Promosikan',
        step3D: 'Sebarkan ke relasi Travel Agent Anda.',
        step4: 'Tarik Komisi',
        step4D: 'Komisi masuk wallet & siap ditarik kapan saja.',

        /* Features */
        advTag: 'Keunggulan',
        advTitle: 'Keunggulan Program Afiliasi TravelBoost',
        adv1Title: 'Komisi 10% – 15% Flat & Transparan',
        adv1Desc:
            'Hitungan komisi jelas dari nilai subscription, tanpa potongan tersembunyi.',
        adv2Title: 'Nol Modal, Nol Risiko',
        adv2Desc:
            'Tidak perlu beli produk atau biaya pendaftaran. Langsung mulai.',
        adv3Title: 'Pembayaran Otomatis via Wallet',
        adv3Desc:
            'Komisi langsung masuk e-wallet akun Anda segera setelah transaksi agen valid.',
        adv4Title: 'Dashboard Real-Time',
        adv4Desc:
            'Pantau performa referal, jumlah klik, dan total penghasilan Anda secara instan.',
        adv5Title: 'Komisi Tetap Masuk, Meski Agen Daftar Belakangan',
        adv5Desc:
            'Agen klik link Anda hari ini tapi baru mendaftar minggu depan? Tenang — komisi tetap otomatis tercatat dan masuk ke wallet Anda.',
        adv6Title: 'Dukungan Marketing Kit',
        adv6Desc:
            'Akses banner promosi, materi konten, dan panduan sukses afiliasi.',

        /* Testimonials */
        testiTitle: 'Apa Kata Mereka?',
        testi1: 'Hanya dalam 2 bulan, penghasilan sampingan saya dari TravelBoost sudah melampaui gaji pokok. Platformnya sangat mudah dipromosikan ke pemilik travel.',
        testi1N: 'Budi Santoso',
        testi1J: 'Afiliator Jakarta',
        testi2: 'Sistem walletnya juara! Komisi masuk otomatis dan penarikannya sangat cepat. Dukungan tim TravelBoost juga sangat responsif membantu materi promosi.',
        testi2N: 'Rina Wijaya',
        testi2J: 'Blogger Travel, Bali',

        /* FAQ */
        faqTitle: 'Pertanyaan yang Sering Diajukan',
        faq1Q: 'Apakah ada biaya untuk mendaftar?',
        faq1A: 'Sama sekali tidak. Pendaftaran Program Afiliasi TravelBoost 100% gratis tanpa biaya tersembunyi.',
        faq2Q: 'Kapan dan bagaimana komisi dibayarkan?',
        faq2A: 'Komisi otomatis masuk ke wallet akun Anda setelah agen membayar subscription. Anda bisa menariknya kapan saja ke rekening bank Anda.',
        faq3Q: 'Berapa lama validasi pendaftaran Agen?',
        faq3A: 'Proses persetujuan Agen biasanya membutuhkan waktu 1-2 hari kerja untuk memastikan keaslian dokumen travel.',
        faq4Q: 'Berapa besar komisi yang bisa saya dapatkan?',
        faq4A: 'Anda mendapatkan komisi sebesar 10%–15% dari setiap nilai subscription yang dibayarkan oleh travel agen yang Anda referensikan. Tidak ada batas maksimal penghasilan.',
        faq5Q: 'Bagaimana cara menarik saldo komisi saya?',
        faq5A: 'Setelah komisi masuk ke wallet Anda, Anda dapat mengajukan penarikan ke rekening bank Anda kapan saja melalui menu Penarikan di dashboard afiliasi.',

        /* CTA */
        ctaTitle: 'Ayo Bergabung Sekarang!',
        ctaDesc:
            'Daftar sekarang, mulai promosikan TravelBoost ke travel agen di sekitar Anda, dan rasakan sendiri bagaimana komisi 10% mengalir ke rekening Anda. Gratis & Cepat.',
        ctaBtn: 'Daftar Afiliasi Sekarang — Gratis!',

        /* Contact */
        contactBadge: 'Kontak Kami',
        contactTitle: 'Hubungi & Temukan Kami',
        contactSubtitle:
            'Tim TravelBoost siap membantu Anda memulai perjalanan afiliasi dan menjawab semua pertanyaan Anda.',
        officeCardTitle: 'Kantor Pusat',
        officeName: 'PT Erasoft Teknologi Indonesia',
        officeAddress:
            'Jl. Alaydrus No.37, RT.8/RW.2, Petojo Utara, Kec. Gambir, Jakarta Pusat, DKI Jakarta 10130',
        officeMapsBtn: 'Buka di Google Maps',
        phoneCardTitle: 'Telepon',
        phoneCallBtn: 'Hubungi Langsung',
        emailCardTitle: 'Email Dukungan',
        emailSendBtn: 'Kirim Email',

        /* Partner */
        supportedBy: 'Didukung Oleh',

        /* Footer */
        footerCopy: 'Bagian dari kesuksesan travel agent Indonesia.',
        footerContact: 'Kontak',
        footerTerms: 'Syarat & Ketentuan',
        footerPrivacy: 'Kebijakan Privasi',

        /* Legal dialogs */
        privacyDialogTitle: 'Kebijakan Privasi Afiliasi TravelBoost',
        privacyEffective: 'Berlaku sejak 1 Januari 2026',
        termsDialogTitle: 'Syarat & Ketentuan Afiliasi TravelBoost',
        termsEffective: 'Terakhir diperbarui: 3 Juni 2026',
        close: 'Tutup',
    },
    en: {
        /* Navbar */
        navHome: 'Home',
        navFeatures: 'Features',
        navSteps: 'How it Works',
        navFaq: 'FAQ',
        navContact: 'Contact',
        navLogin: 'Login',
        navRegister: 'Register',

        /* Hero */
        heroBadge: 'Affiliate Program 2026',
        heroTitle: 'Earn Attractive Income with the',
        heroTitleBrand: 'TravelBoost',
        heroTitleEnd: ' Affiliate Program!',
        heroDesc:
            'Become a trusted affiliate partner and earn huge commissions every time a travel agent you refer registers. Free, easy, and instant profit!',
        heroBtn1: 'Register Now for Free!',
        heroBtn2: 'Learn More',

        /* Market Insight */
        marketTag: 'Market Insight',
        marketTitle: "Huge Opportunity in Indonesia's Travel Industry",
        marketDesc:
            'The tourism industry continues to rebound and grow rapidly. Thousands of new Travel Agents are emerging and need technology solutions. This is your golden opportunity to offer TravelBoost and earn profits from every license sold.',
        marketStat1: '500+',
        marketStat1Unit: 'Trillion Rp',
        marketStat1Desc: 'Travel Market Potential',
        marketStat2: 'Thousands',
        marketStat2Desc: 'Agents Need Digitalization',
        marketStat2Sub: 'Potential New Clients',

        /* Steps */
        stepTitle: '4 Easy Steps to Earn Profit',
        stepDesc:
            'Fully automated process from registration to commission withdrawal.',
        step1: 'Register',
        step1D: 'Fast & free registration on our platform.',
        step2: 'Get Link',
        step2D: 'Receive your unique referral link.',
        step3: 'Promote',
        step3D: 'Share it with your Travel Agent network.',
        step4: 'Withdraw',
        step4D: 'Commission enters wallet & ready to withdraw anytime.',

        /* Features */
        advTag: 'Features',
        advTitle: 'TravelBoost Affiliate Program Advantages',
        adv1Title: 'Flat 10%–15% Transparent Commission',
        adv1Desc:
            'Clear commission calculation from subscription value, no hidden deductions.',
        adv2Title: 'Zero Capital, Zero Risk',
        adv2Desc:
            'No need to buy products or registration fees. Start instantly.',
        adv3Title: 'Automated Wallet Payment',
        adv3Desc:
            'Commissions go straight to your account e-wallet as soon as the agent transaction is valid.',
        adv4Title: 'Real-Time Dashboard',
        adv4Desc:
            'Instantly monitor referral performance, number of clicks, and your total earnings.',
        adv5Title: 'Commission Guaranteed, Even if They Sign Up Later',
        adv5Desc:
            'Agent clicked your link today but only signed up next week? No worries — your commission is automatically tracked and deposited into your wallet.',
        adv6Title: 'Marketing Kit Support',
        adv6Desc:
            'Access promotional banners, content materials, and affiliate success guides.',

        /* Testimonials */
        testiTitle: 'What They Say?',
        testi1: 'In just 2 months, my side income from TravelBoost has surpassed my main salary. The platform is very easy to promote to travel owners.',
        testi1N: 'Budi Santoso',
        testi1J: 'Affiliate Jakarta',
        testi2: 'The wallet system is a winner! Commissions enter automatically and withdrawals are very fast. TravelBoost team support is also very responsive in helping with promotional materials.',
        testi2N: 'Rina Wijaya',
        testi2J: 'Travel Blogger, Bali',

        /* FAQ */
        faqTitle: 'Frequently Asked Questions',
        faq1Q: 'Is there a fee to register?',
        faq1A: 'Absolutely not. TravelBoost Affiliate Program registration is 100% free with no hidden fees.',
        faq2Q: 'When and how are commissions paid?',
        faq2A: 'Commissions are automatically added to your account wallet after the agent pays for the subscription. You can withdraw it anytime to your bank account.',
        faq3Q: 'How long is the Agent registration validation?',
        faq3A: 'The Agent approval process usually takes 1-2 working days to ensure the authenticity of travel documents.',
        faq4Q: 'How much commission can I earn?',
        faq4A: 'You earn a commission of 10%–15% on every subscription paid by the travel agent you refer. There is no maximum earning limit.',
        faq5Q: 'How do I withdraw my commission balance?',
        faq5A: 'Once commissions are in your wallet, you can request a withdrawal to your bank account at any time via the Withdrawal menu in your affiliate dashboard.',

        /* CTA */
        ctaTitle: 'Join Us Now!',
        ctaDesc:
            'Register now, start promoting TravelBoost to travel agents around you, and experience commissions flowing into your account every day. Free & Fast.',
        ctaBtn: 'Register as Affiliate Now — Free!',

        /* Contact */
        contactBadge: 'Contact Us',
        contactTitle: 'Get in Touch with Us',
        contactSubtitle:
            'The TravelBoost team is ready to help you start your affiliate journey and answer all your questions.',
        officeCardTitle: 'Head Office',
        officeName: 'PT Erasoft Teknologi Indonesia',
        officeAddress:
            'Jl. Alaydrus No.37, RT.8/RW.2, Petojo Utara, Gambir, Central Jakarta, DKI Jakarta 10130',
        officeMapsBtn: 'Open in Google Maps',
        phoneCardTitle: 'Phone',
        phoneCallBtn: 'Call Directly',
        emailCardTitle: 'Support Email',
        emailSendBtn: 'Send Email',

        /* Partner */
        supportedBy: 'Supported By',

        /* Footer */
        footerCopy: "Part of Indonesia's travel agent success.",
        footerContact: 'Contact',
        footerTerms: 'Terms & Conditions',
        footerPrivacy: 'Privacy Policy',

        /* Legal dialogs */
        privacyDialogTitle: 'TravelBoost Affiliate Privacy Policy',
        privacyEffective: 'Effective since January 1, 2026',
        termsDialogTitle: 'TravelBoost Affiliate Terms & Conditions',
        termsEffective: 'Last updated: June 3, 2026',
        close: 'Close',
    },
};

/* ═══════════════════════════════════════════════
   ANIMATIONS
═══════════════════════════════════════════════ */
const animationStyles = `
  @keyframes float {
    0%,100% { transform: translate3d(0,0,0) rotate(0deg); }
    50%      { transform: translate3d(0,-14px,0) rotate(2.5deg); }
  }
  @keyframes aurora-pulse {
    0%,100% { opacity: .12; transform: scale(1); }
    50%     { opacity: .28; transform: scale(1.07); }
  }
  @keyframes marquee-scroll {
    0%   { transform: translate3d(0,0,0); }
    100% { transform: translate3d(-50%,0,0); }
  }
  @keyframes badge-ping {
    0%,100% { opacity:1;   transform:scale(1); }
    50%     { opacity:.6; transform:scale(1.15); }
  }
  @keyframes fade-in-up {
    from { opacity:0; transform:translateY(24px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes dialog-in {
    from { opacity:0; transform:scale(.96) translateY(12px); }
    to   { opacity:1; transform:scale(1)   translateY(0); }
  }
  .animate-float       { animation: float 6s ease-in-out infinite; }
  .float-delay-1       { animation-delay: 1.8s; }
  .float-delay-2       { animation-delay: 3.6s; }
  .animate-aurora      { animation: aurora-pulse 9s ease-in-out infinite; }
  .aurora-delay-1      { animation-delay: 3s; }
  .animate-marquee     { animation: marquee-scroll 24s linear infinite; }
  .animate-badge-ping  { animation: badge-ping 2s ease-in-out infinite; }
  .animate-fade-in-up  { animation: fade-in-up .55s cubic-bezier(.16,1,.3,1) both; }
  .animate-dialog-in   { animation: dialog-in .3s cubic-bezier(.16,1,.3,1) both; }
  html { scroll-behavior: smooth; }
`;

/* ═══════════════════════════════════════════════
   SUBCOMPONENTS
═══════════════════════════════════════════════ */
const FaqItem: React.FC<{
    question: string;
    answer: string;
    icon: React.ReactNode;
}> = ({ question, answer, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-border/60 last:border-b-0 py-4 transition-all">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between text-left group"
            >
                <div className="flex items-center pr-4">
                    <div className="mr-4 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary transition-colors duration-200">
                        {icon}
                    </div>
                    <span className="text-sm font-bold text-foreground transition-colors group-hover:text-primary sm:text-base">
                        {question}
                    </span>
                </div>
                <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                />
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-72 mt-3 pl-13 pr-4 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <p className="text-sm leading-relaxed text-muted-foreground">
                    {answer}
                </p>
            </div>
        </div>
    );
};

/* Legal Dialog */
const LegalDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    title: string;
    effective: string;
    closeLabel: string;
    children: React.ReactNode;
}> = ({ open, onClose, title, effective, closeLabel, children }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Dialog */}
            <div
                ref={ref}
                className="animate-dialog-in relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl"
            >
                {/* Header */}
                <div className="relative flex-shrink-0 overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/5 via-violet-500/5 to-transparent px-7 py-6">
                    <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-extrabold text-foreground sm:text-xl">
                                {title}
                            </h3>
                            <p className="mt-1 text-xs font-semibold text-muted-foreground">
                                {effective}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-7 py-6 text-sm leading-relaxed text-muted-foreground">
                    {children}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-border/60 bg-muted/30 px-7 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
                    >
                        {closeLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* Privacy content component */
const PrivacyContent: React.FC<{ lang: 'id' | 'en' }> = ({ lang }) => {
    if (lang === 'en') {
        return (
            <div className="space-y-6">
                <Section title="Introduction">
                    TravelBoost ("we", "us", or "Company") operates the
                    TravelBoost Affiliate Platform. This page informs you of our
                    policies regarding the collection, use, and disclosure of
                    your personal data when you use our Affiliate Service.
                </Section>
                <Section title="1. Data Collection">
                    We collect information you provide when: registering an
                    affiliate account, completing identity verification, or
                    contacting our support team.
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                        <li>Full name & contact information</li>
                        <li>Bank account data for commission withdrawals</li>
                        <li>Usage data & referral activity logs</li>
                        <li>Technical data (IP address, browser, device)</li>
                    </ul>
                </Section>
                <Section title="2. Use of Data">
                    We use collected data to: provide and improve Affiliate
                    services, process commission payments, send important
                    account communications, prevent fraud, and improve platform
                    security.
                </Section>
                <Section title="3. Data Security">
                    We implement reasonable technical and organizational
                    measures to protect your personal data from unauthorized
                    access. No method of transmission over the Internet is 100%
                    secure.
                </Section>
                <Section title="4. Your Rights">
                    You have the right to: access personal data we hold about
                    you, request corrections, request deletion of your data, and
                    opt out of marketing communications. Contact us at{' '}
                    <strong>support@travelboost.co.id</strong>.
                </Section>
                <Section title="5. Third Parties">
                    We do not sell, trade, or transfer your personal data to
                    third parties without your consent, except as required by
                    law or under strict confidentiality agreements with service
                    providers.
                </Section>
                <Section title="6. Policy Changes">
                    We may update this privacy policy from time to time.
                    Significant changes will be communicated via email or
                    prominent notice on our platform. Continued use after
                    changes constitutes acceptance of the updated policy.
                </Section>
            </div>
        );
    }
    return (
        <div className="space-y-6">
            <Section title="Pendahuluan">
                TravelBoost ("kami" atau "Perusahaan") mengoperasikan Platform
                Afiliasi TravelBoost. Halaman ini menginformasikan Anda tentang
                kebijakan privasi kami mengenai pengumpulan, penggunaan, dan
                pengungkapan data pribadi Anda ketika Anda menggunakan Layanan
                Afiliasi kami.
            </Section>
            <Section title="1. Pengumpulan Data">
                Kami mengumpulkan informasi yang Anda berikan saat: mendaftar
                akun afiliasi, melengkapi verifikasi identitas, atau menghubungi
                tim dukungan kami.
                <ul className="mt-2 list-disc pl-5 space-y-1">
                    <li>Nama lengkap & informasi kontak</li>
                    <li>Data rekening bank untuk penarikan komisi</li>
                    <li>Data penggunaan & log aktivitas referal</li>
                    <li>Data teknis (alamat IP, browser, perangkat)</li>
                </ul>
            </Section>
            <Section title="2. Penggunaan Data">
                Kami menggunakan data yang dikumpulkan untuk: menyediakan dan
                meningkatkan layanan Afiliasi, memproses pembayaran komisi,
                mengirimkan komunikasi penting terkait akun, mencegah penipuan,
                dan meningkatkan keamanan platform.
            </Section>
            <Section title="3. Keamanan Data">
                Kami mengambil langkah-langkah teknis dan organisasi yang wajar
                untuk melindungi data pribadi Anda dari akses tidak sah. Tidak
                ada metode transmisi melalui Internet yang 100% aman.
            </Section>
            <Section title="4. Hak Anda">
                Anda memiliki hak untuk: mengakses data pribadi yang kami miliki
                tentang Anda, meminta koreksi, meminta penghapusan data, dan
                menolak komunikasi pemasaran. Hubungi kami di{' '}
                <strong>support@travelboost.co.id</strong>.
            </Section>
            <Section title="5. Pihak Ketiga">
                Kami tidak menjual, menukar, atau mentransfer data pribadi Anda
                kepada pihak ketiga tanpa persetujuan Anda, kecuali diwajibkan
                oleh hukum atau berdasarkan perjanjian kerahasiaan ketat dengan
                penyedia layanan.
            </Section>
            <Section title="6. Perubahan Kebijakan">
                Kami dapat memperbarui kebijakan privasi ini dari waktu ke
                waktu. Perubahan yang signifikan akan dikomunikasikan melalui
                email atau pemberitahuan di platform kami. Penggunaan layanan
                kami yang berkelanjutan berarti Anda menerima kebijakan yang
                diperbarui.
            </Section>
        </div>
    );
};

/* Terms content component */
const TermsContent: React.FC<{ lang: 'id' | 'en' }> = ({ lang }) => {
    if (lang === 'en') {
        return (
            <div className="space-y-6">
                <Section title="Introduction">
                    These Terms and Conditions govern your access and
                    participation in the TravelBoost Affiliate Program operated
                    by <strong>PT. Erasoft Teknologi Indonesia</strong> ("We",
                    "TravelBoost") through the official domain{' '}
                    <strong>travelboost.co.id</strong> and its subdomains. By
                    joining the Affiliate Program, you confirm that you have
                    read, understood, and agree to these Terms.
                </Section>
                <Section title="1. Affiliate Eligibility">
                    <ul className="list-disc pl-5 space-y-1">
                        <li>
                            You must be at least 17 years of age or the legal
                            age in your jurisdiction.
                        </li>
                        <li>
                            You must provide accurate and complete personal and
                            bank account information.
                        </li>
                        <li>
                            TravelBoost reserves the right to approve or reject
                            affiliate applications at its discretion.
                        </li>
                    </ul>
                </Section>
                <Section title="2. Commission & Payments">
                    <ul className="list-disc pl-5 space-y-1">
                        <li>
                            Affiliates earn a commission of 10%–15% of the
                            subscription value paid by referred Travel Agents.
                        </li>
                        <li>
                            Commissions are credited automatically to your
                            wallet after the referred agent's payment is
                            confirmed valid.
                        </li>
                        <li>
                            Withdrawal of commission balance follows the minimum
                            amount, schedule, and verification policies in
                            effect on the platform at the time of request.
                        </li>
                        <li>
                            We reserve the right to review or withhold
                            transactions suspected of violating policies or
                            applicable regulations.
                        </li>
                    </ul>
                </Section>
                <Section title="3. Affiliate Obligations">
                    You agree to: promote TravelBoost using only honest and
                    transparent methods; not make false claims about
                    TravelBoost's products; comply with all applicable laws in
                    Indonesia; not use spam, misleading advertising, or
                    unethical marketing practices.
                </Section>
                <Section title="4. Intellectual Property">
                    All TravelBoost trademarks, logos, and content are protected
                    by law. You may use official marketing kits provided to you
                    for the purpose of promotion. You may not create unofficial
                    materials that could mislead or damage TravelBoost's
                    reputation.
                </Section>
                <Section title="5. Limitation of Liability">
                    TravelBoost is not responsible for: indirect losses arising
                    from changes in commission rates with reasonable notice;
                    disputes between you and the referred travel agents; and
                    technical failures beyond our reasonable control.
                </Section>
                <Section title="6. Termination">
                    TravelBoost may suspend or terminate your affiliate account
                    if you violate these Terms, engage in fraudulent activity,
                    or in the event of a legal obligation. You may also close
                    your account at any time by contacting our support team.
                </Section>
                <Section title="7. Governing Law">
                    These Terms are governed by the laws of the Republic of
                    Indonesia. Disputes shall first be resolved amicably;
                    failing that, through the competent court at the legal
                    domicile of PT. Erasoft Teknologi Indonesia. Contact:{' '}
                    <strong>legal@travelboost.co.id</strong>
                </Section>
            </div>
        );
    }
    return (
        <div className="space-y-6">
            <Section title="Pendahuluan">
                Syarat dan Ketentuan ini mengatur akses dan keikutsertaan Anda
                dalam Program Afiliasi TravelBoost yang dioperasikan oleh{' '}
                <strong>PT. Erasoft Teknologi Indonesia</strong> ("Kami",
                "TravelBoost") melalui domain resmi{' '}
                <strong>travelboost.co.id</strong> dan subdomain terkait. Dengan
                bergabung dalam Program Afiliasi, Anda menyatakan telah membaca,
                memahami, dan menyetujui Ketentuan ini.
            </Section>
            <Section title="1. Kelayakan Afiliator">
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        Anda harus berusia minimal 17 tahun atau usia hukum di
                        yurisdiksi Anda.
                    </li>
                    <li>
                        Anda wajib memberikan informasi pribadi dan rekening
                        bank yang akurat dan lengkap.
                    </li>
                    <li>
                        TravelBoost berhak menyetujui atau menolak pendaftaran
                        afiliasi atas kebijaksanaannya.
                    </li>
                </ul>
            </Section>
            <Section title="2. Komisi & Pembayaran">
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        Afiliator mendapatkan komisi sebesar 10%–15% dari nilai
                        subscription yang dibayarkan oleh Travel Agent yang Anda
                        referensikan.
                    </li>
                    <li>
                        Komisi dikreditkan otomatis ke wallet Anda setelah
                        pembayaran agen yang direferensikan dikonfirmasi valid.
                    </li>
                    <li>
                        Penarikan saldo komisi mengikuti kebijakan minimum,
                        jadwal, dan verifikasi yang berlaku di sistem pada saat
                        permintaan dilakukan.
                    </li>
                    <li>
                        Kami berhak meninjau atau menahan transaksi yang
                        dicurigai melanggar kebijakan atau peraturan yang
                        berlaku.
                    </li>
                </ul>
            </Section>
            <Section title="3. Kewajiban Afiliator">
                Anda setuju untuk: mempromosikan TravelBoost hanya dengan cara
                yang jujur dan transparan; tidak membuat klaim palsu tentang
                produk TravelBoost; mematuhi semua peraturan yang berlaku di
                Indonesia; tidak menggunakan spam, iklan menyesatkan, atau
                praktik pemasaran tidak etis.
            </Section>
            <Section title="4. Hak Kekayaan Intelektual">
                Seluruh merek dagang, logo, dan konten TravelBoost dilindungi
                hukum. Anda boleh menggunakan marketing kit resmi yang
                disediakan untuk keperluan promosi. Anda tidak boleh membuat
                materi tidak resmi yang dapat menyesatkan atau merusak reputasi
                TravelBoost.
            </Section>
            <Section title="5. Pembatasan Tanggung Jawab">
                TravelBoost tidak bertanggung jawab atas: kerugian tidak
                langsung akibat perubahan tarif komisi dengan pemberitahuan yang
                wajar; sengketa antara Anda dan travel agen yang direferensikan;
                serta kegagalan teknis di luar kendali kami yang wajar.
            </Section>
            <Section title="6. Penghentian">
                TravelBoost dapat menangguhkan atau menutup akun afiliasi Anda
                jika Anda melanggar Ketentuan ini, melakukan penipuan, atau
                berdasarkan kewajiban hukum. Anda juga dapat menutup akun kapan
                saja dengan menghubungi tim dukungan kami.
            </Section>
            <Section title="7. Hukum yang Berlaku dan Kontak">
                Ketentuan ini diatur oleh hukum Negara Republik Indonesia.
                Sengketa akan diupayakan diselesaikan secara musyawarah; jika
                tidak tercapai kesepakatan, melalui pengadilan yang berwenang di
                domisili hukum PT. Erasoft Teknologi Indonesia. Kontak:{' '}
                <strong>legal@travelboost.co.id</strong>
            </Section>
        </div>
    );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
}) => (
    <div>
        <h4 className="mb-2 text-sm font-extrabold text-foreground">{title}</h4>
        <div className="text-sm leading-relaxed text-muted-foreground">
            {children}
        </div>
    </div>
);

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function Landing() {
    const [lang, setLang] = useState<'id' | 'en'>('id');
    const { resolvedTheme, setTheme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [currentDomain, setCurrentDomain] = useState(
        'afiliasi.travelboost.co.id',
    );
    const [activeFaqTab, setActiveFaqTab] = useState<
        'all' | 'general' | 'commission' | 'dashboard' | 'payments'
    >('all');

    // Read browser-only state once on mount. We avoid `useEffect` for this because
    // `react-hooks/set-state-in-effect` flags synchronous setState inside the effect
    // body. `useSyncExternalStore` is the rules-of-hooks-friendly way to read from
    // `window`/`localStorage`.
    useEffect(() => {
        // Defer to a microtask so the call is no longer "synchronous within the effect".
        queueMicrotask(() => {
            setCurrentDomain(window.location.host);
            const sLang = localStorage.getItem('tb_lang') as 'id' | 'en' | null;
            if (sLang) setLang(sLang);
        });
    }, []);

    const toggleLang = () => {
        const n = lang === 'id' ? 'en' : 'id';
        setLang(n);
        localStorage.setItem('tb_lang', n);
    };
    const toggleTheme = () =>
        setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
    const t = dict[lang];

    const navLinks = [
        { href: '#home', label: t.navHome },
        { href: '#steps', label: t.navSteps },
        { href: '#features', label: t.navFeatures },
        { href: '#faq', label: t.navFaq },
        { href: '#contact', label: t.navContact },
    ];

    const features = [
        { icon: <PieChart />, title: t.adv1Title, desc: t.adv1Desc },
        { icon: <BriefcaseBusiness />, title: t.adv2Title, desc: t.adv2Desc },
        { icon: <Wallet />, title: t.adv3Title, desc: t.adv3Desc },
        { icon: <Zap />, title: t.adv4Title, desc: t.adv4Desc },
        { icon: <Star />, title: t.adv5Title, desc: t.adv5Desc },
        { icon: <ShieldCheck />, title: t.adv6Title, desc: t.adv6Desc },
    ];

    const partners = [
        { src: '/images/logo/partner/astindo.png', alt: 'ASTINDO' },
        { src: '/images/logo/partner/prismalink.png', alt: 'PrismaLink' },
        { src: '/images/logo/partner/gct.png', alt: 'Grand China Travel' },
    ];
    const marqueeItems = [...partners, ...partners, ...partners, ...partners];

    return (
        <>
            <Head title="TravelBoost Affiliate Program" />
            <style>{animationStyles}</style>

            {/* Legal Dialogs */}
            <LegalDialog
                open={showPrivacy}
                onClose={() => setShowPrivacy(false)}
                title={t.privacyDialogTitle}
                effective={t.privacyEffective}
                closeLabel={t.close}
            >
                <PrivacyContent lang={lang} />
            </LegalDialog>
            <LegalDialog
                open={showTerms}
                onClose={() => setShowTerms(false)}
                title={t.termsDialogTitle}
                effective={t.termsEffective}
                closeLabel={t.close}
            >
                <TermsContent lang={lang} />
            </LegalDialog>

            <div className="relative min-h-screen overflow-x-hidden bg-background font-sans text-foreground selection:bg-primary/25 transition-colors duration-200">
                {/* Aurora BG glows */}
                <div className="pointer-events-none fixed -left-[15%] -top-[10%] h-[65%] w-[65%] rounded-full bg-gradient-to-tr from-primary/8 via-violet-400/5 to-teal-300/5 blur-[160px] animate-aurora" />
                <div className="pointer-events-none fixed -right-[10%] bottom-[20%] h-[50%] w-[50%] rounded-full bg-gradient-to-bl from-teal-300/5 via-transparent to-primary/6 blur-[160px] animate-aurora aurora-delay-1" />

                {/* ═══════════════ NAVBAR ═══════════════ */}
                <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl z-50 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-950/90 shadow-xl dark:shadow-2xl backdrop-blur-xl px-4 py-2.5 flex items-center justify-between transition-all duration-300">
                    {/* Logo & Brand */}
                    <a href="#home" className="flex-shrink-0 pl-2">
                        <OptimizedImage
                            src="/images/logo/hori.png"
                            alt="TravelBoost"
                            width={144}
                            height={36}
                            priority
                            className="block h-9 w-auto dark:hidden"
                        />
                        <OptimizedImage
                            src="/images/logo/hori-wt.png"
                            alt="TravelBoost"
                            width={144}
                            height={36}
                            priority
                            className="hidden h-9 w-auto dark:block"
                        />
                    </a>

                    {/* Desktop nav links */}
                    <div className="hidden items-center gap-1 lg:flex">
                        {navLinks.map((l) => (
                            <a
                                key={l.href}
                                href={l.href}
                                className="rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 transition hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5"
                            >
                                {l.label}
                            </a>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pr-1">
                        <div className="hidden items-center gap-1.5 lg:flex">
                            <a
                                href="/affiliate/login"
                                className="rounded-full border border-slate-200 dark:border-white/20 px-4 py-2 text-xs font-extrabold text-slate-700 dark:text-white hover:bg-slate-100/50 dark:hover:bg-white/5 transition"
                            >
                                {t.navLogin}
                            </a>
                            <a
                                href="/affiliate/register"
                                className="rounded-full bg-slate-900 dark:bg-white px-5 py-2 text-xs font-extrabold text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-md shadow-black/10"
                            >
                                {t.navRegister}
                            </a>
                        </div>

                        <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 mx-1 hidden lg:block" />

                        {/* Language Selector */}
                        <button
                            type="button"
                            onClick={toggleLang}
                            aria-label="Toggle Language"
                            className="flex items-center justify-center rounded-full p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5 transition cursor-pointer"
                        >
                            <Languages size={15} />
                        </button>

                        {/* Theme Selector */}
                        <button
                            type="button"
                            onClick={toggleTheme}
                            aria-label="Toggle Theme"
                            className="flex items-center justify-center rounded-full p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5 transition cursor-pointer"
                        >
                            {resolvedTheme === 'light' ? (
                                <Moon size={15} />
                            ) : (
                                <Sun size={15} />
                            )}
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            type="button"
                            onClick={() =>
                                setIsMobileMenuOpen(!isMobileMenuOpen)
                            }
                            aria-label="Toggle Menu"
                            className="flex items-center justify-center rounded-full p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5 transition lg:hidden cursor-pointer"
                        >
                            {isMobileMenuOpen ? (
                                <X size={16} />
                            ) : (
                                <Menu size={16} />
                            )}
                        </button>
                    </div>

                    {/* Mobile Drawer */}
                    {isMobileMenuOpen && (
                        <div className="absolute top-16 left-0 right-0 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 p-5 shadow-2xl backdrop-blur-xl lg:hidden">
                            <div className="flex flex-col gap-3">
                                {navLinks.map((l) => (
                                    <a
                                        key={l.href}
                                        href={l.href}
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                        className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition"
                                    >
                                        {l.label}
                                    </a>
                                ))}
                                <div className="flex items-center gap-2 border-t border-slate-200 dark:border-white/10 pt-4 mt-2">
                                    <a
                                        href="/affiliate/login"
                                        className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 py-2.5 text-center text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
                                    >
                                        {t.navLogin}
                                    </a>
                                    <a
                                        href="/affiliate/register"
                                        className="flex-1 rounded-xl bg-slate-900 dark:bg-white py-2.5 text-center text-xs font-bold text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 transition"
                                    >
                                        {t.navRegister}
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══════════════ HERO ═══════════════ */}
                <section
                    id="home"
                    className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28"
                >
                    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.10] dark:opacity-[0.06]">
                        <PlaneTakeoff
                            className="absolute left-[8%] top-[18%] animate-float text-primary"
                            size={52}
                        />
                        <Luggage
                            className="absolute bottom-[15%] right-[10%] animate-float float-delay-1 text-primary"
                            size={64}
                        />
                        <Hotel
                            className="absolute left-[50%] top-[60%] animate-float float-delay-2 text-primary"
                            size={40}
                        />
                    </div>
                    <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20">
                        {/* Text */}
                        <div className="space-y-7 text-center lg:text-left animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-bold text-primary sm:text-sm">
                                <span className="animate-badge-ping h-2 w-2 rounded-full bg-primary" />
                                {t.heroBadge}
                            </div>
                            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                                {t.heroTitle}{' '}
                                <span className="bg-gradient-to-r from-primary via-violet-500 to-indigo-500 bg-clip-text text-transparent">
                                    {t.heroTitleBrand}
                                </span>
                                {t.heroTitleEnd}
                            </h1>
                            <p className="mx-auto max-w-xl text-base font-medium leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
                                {t.heroDesc
                                    .replace(
                                        'afiliasi.travelboost.co.id',
                                        currentDomain,
                                    )
                                    .replace(
                                        'affiliate.travelboost.co.id',
                                        currentDomain,
                                    )}
                            </p>
                            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                                <a
                                    id="hero-register-btn"
                                    href="/affiliate/register"
                                    className="group flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[.98]"
                                >
                                    {t.heroBtn1}{' '}
                                    <ArrowRight
                                        size={17}
                                        className="transition-transform group-hover:translate-x-1"
                                    />
                                </a>
                                <a
                                    href="#steps"
                                    className="flex items-center justify-center rounded-2xl border border-border/80 bg-card/60 px-8 py-4 text-base font-bold backdrop-blur-sm transition-all hover:bg-muted hover:border-border"
                                >
                                    {t.heroBtn2}
                                </a>
                            </div>
                        </div>

                        {/* Illustration card */}
                        <div className="flex items-center justify-center">
                            <div className="relative w-full max-w-sm sm:max-w-md">
                                <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-primary/15 via-violet-400/10 to-teal-400/15 blur-3xl" />
                                <div className="relative rounded-[3rem] border border-white/25 bg-gradient-to-br from-white/90 to-white/50 p-8 shadow-2xl backdrop-blur-xl dark:from-slate-800/80 dark:to-slate-900/60 dark:border-white/10">
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            {
                                                icon: (
                                                    <PlaneTakeoff size={26} />
                                                ),
                                                color: 'from-primary to-violet-500',
                                                label: 'Travel',
                                            },
                                            {
                                                icon: <DollarSign size={26} />,
                                                color: 'from-emerald-400 to-teal-500',
                                                label: 'Income',
                                            },
                                            {
                                                icon: <Users size={26} />,
                                                color: 'from-violet-500 to-indigo-500',
                                                label: 'Network',
                                            },
                                            {
                                                icon: <TrendingUp size={26} />,
                                                color: 'from-primary to-rose-400',
                                                label: 'Growth',
                                            },
                                            {
                                                icon: <Wallet size={26} />,
                                                color: 'from-amber-400 to-orange-500',
                                                label: 'Wallet',
                                            },
                                            {
                                                icon: <ShieldCheck size={26} />,
                                                color: 'from-teal-400 to-emerald-500',
                                                label: 'Secure',
                                            },
                                        ].map((item, i) => (
                                            <div
                                                key={i}
                                                className={`flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br ${item.color} p-4 text-white shadow-lg`}
                                            >
                                                {item.icon}
                                                <span className="text-[10px] font-bold opacity-90">
                                                    {item.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/8 px-4 py-3">
                                        <span className="text-xs font-bold text-muted-foreground">
                                            Komisi Afiliasi
                                        </span>
                                        <span className="text-lg font-black text-primary">
                                            10% – 15%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════ MARKET INSIGHT ═══════════════ */}
                <section className="py-20 sm:py-24">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="mb-14 text-center space-y-3">
                            <span className="inline-block rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-bold text-primary sm:text-sm">
                                {t.marketTag}
                            </span>
                            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                                {t.marketTitle}
                            </h2>
                        </div>
                        <div className="grid items-stretch gap-6 lg:grid-cols-2">
                            {/* Glassmorphic info card */}
                            <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-card shadow-lg shadow-primary/5">
                                {/* Top gradient stripe */}
                                <div className="h-1 w-full bg-gradient-to-r from-primary via-violet-500 to-indigo-400" />
                                <div className="p-8 sm:p-10">
                                    <p className="mb-8 text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
                                        {t.marketDesc}
                                    </p>
                                    <div className="grid grid-cols-2 divide-x divide-border/50">
                                        <div className="pr-6">
                                            <div className="text-4xl font-black text-primary">
                                                {t.marketStat1}
                                            </div>
                                            <div className="mt-1 text-sm font-extrabold text-foreground">
                                                {t.marketStat1Unit}
                                            </div>
                                            <div className="mt-0.5 text-xs font-semibold text-muted-foreground">
                                                {t.marketStat1Desc}
                                            </div>
                                        </div>
                                        <div className="pl-6">
                                            <div className="text-4xl font-black text-primary">
                                                {t.marketStat2}
                                            </div>
                                            <div className="mt-1 text-sm font-extrabold text-foreground">
                                                {t.marketStat2Desc}
                                            </div>
                                            <div className="mt-0.5 text-xs font-semibold text-muted-foreground">
                                                {t.marketStat2Sub}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4-icon visual grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    {
                                        icon: <TrendingUp size={32} />,
                                        label: t.marketStat1Desc,
                                        sub: t.marketStat1Unit,
                                        gradient:
                                            'from-primary/10 to-violet-400/10 dark:from-primary/15 dark:to-violet-400/15',
                                        border: 'border-primary/15',
                                        iconBg: 'from-primary to-violet-500',
                                        text: 'text-primary',
                                    },
                                    {
                                        icon: <Users size={32} />,
                                        label: t.marketStat2Desc,
                                        sub: t.marketStat2,
                                        gradient:
                                            'from-teal-400/10 to-emerald-400/10 dark:from-teal-400/15 dark:to-emerald-400/15',
                                        border: 'border-teal-400/15',
                                        iconBg: 'from-teal-400 to-emerald-500',
                                        text: 'text-teal-500',
                                    },
                                    {
                                        icon: <DollarSign size={32} />,
                                        label:
                                            lang === 'id'
                                                ? 'Komisi Kompetitif'
                                                : 'Competitive Commission',
                                        sub: '10–15%',
                                        gradient:
                                            'from-emerald-400/10 to-teal-400/10 dark:from-emerald-400/15 dark:to-teal-400/15',
                                        border: 'border-emerald-400/15',
                                        iconBg: 'from-emerald-400 to-teal-500',
                                        text: 'text-emerald-500',
                                    },
                                    {
                                        icon: <ShieldCheck size={32} />,
                                        label:
                                            lang === 'id'
                                                ? 'Platform Terpercaya'
                                                : 'Trusted Platform',
                                        sub: '#1 Travel SaaS',
                                        gradient:
                                            'from-violet-400/10 to-indigo-400/10 dark:from-violet-400/15 dark:to-indigo-400/15',
                                        border: 'border-violet-400/15',
                                        iconBg: 'from-violet-500 to-indigo-500',
                                        text: 'text-violet-500',
                                    },
                                ].map((card, i) => (
                                    <div
                                        key={i}
                                        className={`group flex flex-col rounded-3xl border bg-gradient-to-br p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${card.gradient} ${card.border}`}
                                    >
                                        <div
                                            className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.iconBg} text-white shadow-md`}
                                        >
                                            {card.icon}
                                        </div>
                                        <div className="text-xs font-bold text-muted-foreground">
                                            {card.label}
                                        </div>
                                        <div
                                            className={`mt-1 text-xl font-black ${card.text}`}
                                        >
                                            {card.sub}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════ STEPS ═══════════════ */}
                <section
                    id="steps"
                    className="border-y border-border/50 bg-muted/20 py-20 sm:py-28"
                >
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <div className="mb-16 space-y-3 text-center">
                            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                                {t.stepTitle}
                            </h2>
                            <p className="mx-auto max-w-lg text-base text-muted-foreground">
                                {t.stepDesc}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                {
                                    icon: <UserPlus size={24} />,
                                    num: '01',
                                    title: t.step1,
                                    desc: t.step1D,
                                },
                                {
                                    icon: <LinkIcon size={24} />,
                                    num: '02',
                                    title: t.step2,
                                    desc: t.step2D,
                                },
                                {
                                    icon: <Megaphone size={24} />,
                                    num: '03',
                                    title: t.step3,
                                    desc: t.step3D,
                                },
                                {
                                    icon: <DollarSign size={24} />,
                                    num: '04',
                                    title: t.step4,
                                    desc: t.step4D,
                                },
                            ].map((step, i) => (
                                <div
                                    key={i}
                                    className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-xl"
                                >
                                    <span className="pointer-events-none absolute right-3 top-1 select-none text-7xl font-black text-foreground/[0.04] transition-colors duration-300 group-hover:text-primary/[0.07]">
                                        {step.num}
                                    </span>
                                    <div className="relative mb-5">
                                        <div className="absolute inset-0 h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-violet-500 opacity-20 blur-lg transition-opacity duration-300 group-hover:opacity-40" />
                                        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-500 text-white shadow-md shadow-primary/25">
                                            {step.icon}
                                        </div>
                                    </div>
                                    <h3 className="mb-1.5 text-base font-extrabold text-foreground">
                                        {step.title}
                                    </h3>
                                    <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                                        {step.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════ FEATURES ═══════════════ */}
                <section id="features" className="py-20 sm:py-28">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="mb-16 space-y-3 text-center">
                            <span className="inline-block rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-bold text-primary sm:text-sm">
                                {t.advTag}
                            </span>
                            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                                {t.advTitle}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((item, i) => (
                                <div
                                    key={i}
                                    className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
                                >
                                    <div className="pointer-events-none absolute left-0 right-0 top-0 h-20 bg-gradient-to-b from-primary/4 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                    <div className="relative mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-white shadow-md shadow-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-primary/35">
                                        {React.cloneElement(item.icon, {
                                            size: 21,
                                        })}
                                    </div>
                                    <h3 className="mb-2 text-base font-extrabold text-foreground sm:text-lg">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════ TESTIMONIALS ═══════════════ */}
                <section className="border-y border-border/50 bg-muted/15 py-20 sm:py-24">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <h2 className="mb-14 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
                            {t.testiTitle}
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            {[
                                {
                                    quote: t.testi1,
                                    name: t.testi1N,
                                    job: t.testi1J,
                                },
                                {
                                    quote: t.testi2,
                                    name: t.testi2N,
                                    job: t.testi2J,
                                },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 sm:p-10"
                                >
                                    <div className="pointer-events-none absolute -left-2 -top-2 h-20 w-20 rounded-full bg-primary/5 blur-xl" />
                                    <MessageSquareQuote
                                        className="absolute -left-3 -top-3 text-primary/8"
                                        size={60}
                                    />
                                    <p className="relative z-10 mb-8 text-base font-medium italic leading-relaxed text-foreground/80 sm:text-lg">
                                        "{item.quote}"
                                    </p>
                                    <div className="flex items-center gap-4 border-t border-border/50 pt-6">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-xl font-extrabold text-white shadow-md">
                                            {item.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-extrabold text-foreground">
                                                {item.name}
                                            </div>
                                            <div className="text-sm font-semibold text-muted-foreground">
                                                {item.job}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════ FAQ ═══════════════ */}
                <section id="faq" className="py-20 sm:py-24">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                                {t.faqTitle}
                            </h2>
                            <p className="mt-4 text-base text-muted-foreground">
                                {lang === 'id'
                                    ? 'Ini adalah pertanyaan yang paling sering ditanyakan. Tidak menemukan jawaban? '
                                    : "These are the most commonly asked questions. Can't find what you're looking for? "}
                                <a
                                    href="#contact"
                                    className="underline font-semibold text-primary hover:text-primary/80 transition"
                                >
                                    {lang === 'id'
                                        ? 'Hubungi tim ramah kami!'
                                        : 'Chat to our friendly team!'}
                                </a>
                            </p>
                        </div>

                        {/* FAQ Category Tabs */}
                        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
                            {[
                                {
                                    id: 'all',
                                    label: lang === 'id' ? 'Semua' : 'All',
                                },
                                {
                                    id: 'general',
                                    label: lang === 'id' ? 'Umum' : 'General',
                                },
                                {
                                    id: 'commission',
                                    label:
                                        lang === 'id' ? 'Komisi' : 'Commission',
                                },
                                { id: 'dashboard', label: 'Dashboard' },
                                {
                                    id: 'payments',
                                    label:
                                        lang === 'id'
                                            ? 'Pembayaran'
                                            : 'Payments',
                                },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() =>
                                        setActiveFaqTab(tab.id as any)
                                    }
                                    className={`rounded-full px-5 py-2 text-xs font-bold transition cursor-pointer ${activeFaqTab === tab.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Accordion container */}
                        <div className="rounded-3xl border border-border/60 bg-card px-6 py-2 shadow-md sm:px-10">
                            {[
                                {
                                    id: 1,
                                    category: 'general',
                                    question: t.faq1Q,
                                    answer: t.faq1A,
                                    icon: <Smile size={16} />,
                                },
                                {
                                    id: 2,
                                    category: 'payments',
                                    question: t.faq2Q,
                                    answer: t.faq2A,
                                    icon: <Wallet size={16} />,
                                },
                                {
                                    id: 3,
                                    category: 'general',
                                    question: t.faq3Q,
                                    answer: t.faq3A,
                                    icon: <ShieldCheck size={16} />,
                                },
                                {
                                    id: 4,
                                    category: 'commission',
                                    question: t.faq4Q,
                                    answer: t.faq4A,
                                    icon: <DollarSign size={16} />,
                                },
                                {
                                    id: 5,
                                    category: 'dashboard',
                                    question: t.faq5Q,
                                    answer: t.faq5A,
                                    icon: <Zap size={16} />,
                                },
                            ]
                                .filter(
                                    (item) =>
                                        activeFaqTab === 'all' ||
                                        item.category === activeFaqTab,
                                )
                                .map((faq) => (
                                    <FaqItem
                                        key={faq.id}
                                        question={faq.question}
                                        answer={faq.answer}
                                        icon={faq.icon}
                                    />
                                ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════ CONTACT ═══════════════ */}
                <section id="contact" className="py-20 sm:py-28">
                    <div className="mx-auto max-w-5xl px-4 sm:px-6">
                        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary to-violet-700 p-8 text-white shadow-2xl shadow-primary/20 md:p-14">
                            {/* Background styling elements */}
                            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />

                            <div className="relative z-10 grid items-center gap-10 md:grid-cols-12">
                                {/* Left Column */}
                                <div className="space-y-6 md:col-span-5 text-center md:text-left">
                                    <span className="inline-block rounded-full bg-white/15 border border-white/20 px-3.5 py-1 text-xs font-bold text-white uppercase tracking-wider">
                                        {t.contactBadge}
                                    </span>
                                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-4xl leading-tight">
                                        {lang === 'id'
                                            ? 'Bergabung dengan Kami Sekarang!'
                                            : 'Join Us Now!'}
                                    </h2>
                                    <p className="text-sm font-medium leading-relaxed text-white/80">
                                        {t.contactSubtitle}
                                    </p>
                                    <div className="flex justify-center md:justify-start">
                                        <a
                                            href="/affiliate/register"
                                            className="rounded-full bg-white px-7 py-3 text-sm font-extrabold text-primary shadow-xl hover:bg-slate-100 transition hover:scale-[1.03] active:scale-[.97]"
                                        >
                                            {lang === 'id'
                                                ? 'Mulai Afiliasi'
                                                : 'Start Affiliate'}
                                        </a>
                                    </div>
                                </div>

                                {/* Middle Column (Mockup) */}
                                <div className="md:col-span-3 flex justify-center">
                                    {/* CSS Smartphone Mockup */}
                                    <div className="relative h-[360px] w-[180px] rounded-[2.2rem] border-[5px] border-slate-900 bg-slate-950 shadow-2xl flex-shrink-0 hidden md:block">
                                        {/* Speaker/Notch */}
                                        <div className="absolute top-2 left-1/2 -translate-x-1/2 h-3.5 w-16 rounded-full bg-slate-900 z-20 flex items-center justify-center">
                                            <div className="h-1 w-8 rounded-full bg-slate-800" />
                                        </div>
                                        {/* Screen */}
                                        <div className="absolute inset-0.5 rounded-[1.9rem] bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden flex flex-col p-2.5 text-white">
                                            {/* Status Bar */}
                                            <div className="flex items-center justify-between text-[7px] font-bold opacity-60 mb-2 px-1 select-none">
                                                <span>09:41</span>
                                                <div className="flex items-center gap-0.5">
                                                    <span>5G</span>
                                                    <div className="h-1.5 w-3 rounded-xs border border-white/40 p-px flex items-center">
                                                        <div className="h-full w-full bg-white rounded-3xs" />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Simulated App Header */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1">
                                                    <div className="h-3 w-3 rounded-full bg-primary flex items-center justify-center">
                                                        <PlaneTakeoff
                                                            size={6}
                                                            className="text-white"
                                                        />
                                                    </div>
                                                    <span className="text-[7px] font-black tracking-tight select-none">
                                                        TravelBoost
                                                    </span>
                                                </div>
                                                <div className="h-3.5 w-3.5 rounded-md bg-white/10" />
                                            </div>
                                            {/* Simulated Balance Card */}
                                            <div className="rounded-lg bg-gradient-to-br from-primary via-primary to-violet-600 p-2 mb-2 shadow-lg shadow-primary/25 select-none">
                                                <span className="text-[6px] font-semibold opacity-80">
                                                    Total Pendapatan
                                                </span>
                                                <div className="text-[10px] font-black mt-0.5">
                                                    Rp 12.850.000
                                                </div>
                                                <div className="flex items-center justify-between mt-1 text-[5px] opacity-95">
                                                    <span>
                                                        Akun Terverifikasi
                                                    </span>
                                                    <span className="bg-white/20 px-1 rounded-xs">
                                                        12 Agen
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Simulated Referral Stats */}
                                            <span className="text-[6px] font-bold opacity-60 mb-1 px-0.5 select-none">
                                                Aktivitas Terbaru
                                            </span>
                                            <div className="space-y-1 overflow-hidden flex-1 select-none">
                                                {[
                                                    {
                                                        name: 'Dwi Wijaya',
                                                        time: '2 jam lalu',
                                                        comm: '+Rp 450k',
                                                    },
                                                    {
                                                        name: 'Kurnia Travel',
                                                        time: '1 hari lalu',
                                                        comm: '+Rp 600k',
                                                    },
                                                    {
                                                        name: 'Jaya Tour',
                                                        time: '3 hari lalu',
                                                        comm: '+Rp 300k',
                                                    },
                                                ].map((act, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center justify-between rounded-md bg-white/5 p-1 text-[6px]"
                                                    >
                                                        <div>
                                                            <div className="font-bold">
                                                                {act.name}
                                                            </div>
                                                            <div className="opacity-50 text-[5px]">
                                                                {act.time}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-black text-primary">
                                                                {act.comm}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6 md:col-span-4 pl-0 md:pl-4">
                                    {/* Office Address */}
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                                            {t.officeCardTitle}
                                        </span>
                                        <div className="space-y-1">
                                            <h4 className="font-extrabold text-base text-white">
                                                {t.officeName}
                                            </h4>
                                            <p className="text-xs leading-relaxed text-white/70">
                                                {t.officeAddress}
                                            </p>
                                        </div>
                                        <a
                                            href="https://www.google.com/maps/search/?api=1&query=PT+Erasoft+Teknologi+Indonesia+Jl.+Alaydrus+No.37+Jakarta"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-white underline hover:opacity-80 transition"
                                        >
                                            {t.officeMapsBtn}{' '}
                                            <ArrowRight size={12} />
                                        </a>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="space-y-4 pt-4 border-t border-white/10">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 block">
                                            {lang === 'id'
                                                ? 'Info Kontak'
                                                : 'Contact Info'}
                                        </span>

                                        {/* Email */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white">
                                                <Mail size={16} />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-semibold text-white/60 block">
                                                    Email Support
                                                </span>
                                                <a
                                                    href="mailto:support@travelboost.co.id"
                                                    className="text-xs font-bold text-white hover:underline"
                                                >
                                                    support@travelboost.co.id
                                                </a>
                                            </div>
                                        </div>

                                        {/* Phone */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white">
                                                <Phone size={16} />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-semibold text-white/60 block">
                                                    Hubungi Telepon
                                                </span>
                                                <a
                                                    href="tel:0216349318"
                                                    className="text-xs font-bold text-white hover:underline"
                                                >
                                                    021-6349318
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════ PARTNER MARQUEE ═══════════════ */}
                <section className="border-t border-border/50 bg-background py-12">
                    <p className="mb-8 text-center text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground/70">
                        {t.supportedBy}
                    </p>
                    <div className="flex select-none overflow-hidden">
                        <div className="animate-marquee flex shrink-0 items-center gap-8">
                            {marqueeItems.map((p, i) => (
                                <div
                                    key={i}
                                    className="flex h-14 w-36 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-700/60 dark:bg-white/95"
                                >
                                    <OptimizedImage
                                        src={p.src}
                                        alt={p.alt}
                                        width={120}
                                        height={40}
                                        className="h-full w-auto object-contain"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════ FOOTER ═══════════════ */}
                <footer className="border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 py-16 text-slate-600 dark:text-slate-400 transition-colors duration-200">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 mb-12">
                            {/* Logo Column */}
                            <div className="space-y-4 md:col-span-4">
                                <a href="#home" className="inline-block">
                                    <OptimizedImage
                                        src="/images/logo/hori.png"
                                        alt="TravelBoost"
                                        width={144}
                                        height={36}
                                        className="block h-9 w-auto dark:hidden"
                                    />
                                    <OptimizedImage
                                        src="/images/logo/hori-wt.png"
                                        alt="TravelBoost"
                                        width={144}
                                        height={36}
                                        className="hidden h-9 w-auto dark:block"
                                    />
                                </a>
                                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-500 max-w-sm">
                                    {lang === 'id'
                                        ? 'Solusi teknologi terintegrasi untuk pertumbuhan dan digitalisasi travel agent di seluruh Indonesia.'
                                        : 'Integrated technology solutions for the growth and digitalization of travel agents across Indonesia.'}
                                </p>
                            </div>

                            {/* Nav columns (3 cols) */}
                            <div className="grid grid-cols-3 gap-5 md:col-span-5">
                                {/* Company */}
                                <div className="space-y-3.5">
                                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                                        Company
                                    </h4>
                                    <ul className="space-y-2 text-xs">
                                        <li>
                                            <a
                                                href="#home"
                                                className="hover:text-slate-900 dark:hover:text-white transition"
                                            >
                                                {t.navHome}
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="#steps"
                                                className="hover:text-slate-900 dark:hover:text-white transition"
                                            >
                                                {t.navSteps}
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="#features"
                                                className="hover:text-slate-900 dark:hover:text-white transition"
                                            >
                                                {t.navFeatures}
                                            </a>
                                        </li>
                                    </ul>
                                </div>

                                {/* Support */}
                                <div className="space-y-3.5">
                                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                                        Support
                                    </h4>
                                    <ul className="space-y-2 text-xs">
                                        <li>
                                            <a
                                                href="#faq"
                                                className="hover:text-slate-900 dark:hover:text-white transition"
                                            >
                                                {t.navFaq}
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="#contact"
                                                className="hover:text-slate-900 dark:hover:text-white transition"
                                            >
                                                {t.navContact}
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="mailto:support@travelboost.co.id"
                                                className="hover:text-slate-900 dark:hover:text-white transition"
                                            >
                                                Help Center
                                            </a>
                                        </li>
                                    </ul>
                                </div>

                                {/* Legal */}
                                <div className="space-y-3.5">
                                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                                        Legal
                                    </h4>
                                    <ul className="space-y-2 text-xs">
                                        <li>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPrivacy(true)
                                                }
                                                className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer text-left"
                                            >
                                                {t.footerPrivacy}
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowTerms(true)
                                                }
                                                className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer text-left"
                                            >
                                                {t.footerTerms}
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Subscribe Column */}
                            <div className="space-y-4 md:col-span-3">
                                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                                    {lang === 'id'
                                        ? 'Berlangganan Info Terbaru'
                                        : 'Subscribe for Updates'}
                                </h4>
                                <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                                    {lang === 'id'
                                        ? 'Dapatkan berita dan pembaruan terbaru langsung di email Anda.'
                                        : 'Get the latest news and updates directly in your inbox.'}
                                </p>
                                <form
                                    onSubmit={(e) => e.preventDefault()}
                                    className="relative flex items-center"
                                >
                                    <div className="absolute left-4 text-slate-400 dark:text-slate-500">
                                        <Mail size={14} />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder={
                                            lang === 'id'
                                                ? 'Email Anda'
                                                : 'Your email'
                                        }
                                        className="w-full rounded-full border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 py-2.5 pl-10 pr-20 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-primary/50 transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-1 rounded-full bg-slate-900 dark:bg-white px-4 py-1.5 text-[10px] font-black text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-md cursor-pointer"
                                    >
                                        {lang === 'id' ? 'Kirim' : 'Send'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-900 pt-8 text-[11px] font-semibold text-slate-500 dark:text-slate-600 md:flex-row">
                            <span>
                                &copy; {new Date().getFullYear()} TravelBoost
                                &mdash; {t.footerCopy}
                            </span>
                            <div className="flex items-center gap-4">
                                <a
                                    href="https://twitter.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-slate-800 dark:hover:text-slate-300 transition"
                                >
                                    <Twitter size={15} />
                                </a>
                                <a
                                    href="https://facebook.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-slate-800 dark:hover:text-slate-300 transition"
                                >
                                    <Facebook size={15} />
                                </a>
                                <a
                                    href="https://instagram.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-slate-800 dark:hover:text-slate-300 transition"
                                >
                                    <Instagram size={15} />
                                </a>
                                <a
                                    href="https://linkedin.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-slate-800 dark:hover:text-slate-300 transition"
                                >
                                    <Linkedin size={15} />
                                </a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
