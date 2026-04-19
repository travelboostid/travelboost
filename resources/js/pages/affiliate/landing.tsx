import { Head } from '@inertiajs/react';
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  DollarSign,
  Hotel,
  Languages,
  LinkIcon,
  Luggage,
  Megaphone,
  Menu,
  MessageSquareQuote,
  Moon,
  PieChart,
  PlaneTakeoff,
  ShieldCheck,
  Sun,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

// --- KAMUS BAHASA ---
const dict = {
  id: {
    navHome: 'Beranda',
    navFeatures: 'Keunggulan',
    navSteps: 'Cara Kerja',
    navFaq: 'FAQ',
    navLogin: 'Masuk',
    navRegister: 'Daftar',

    heroTitle: 'Raih Penghasilan Menarik dengan Program Afiliasi TravelBoost!',
    heroDesc:
      'Jadilah mitra afiliasi terpercaya dan hasilkan komisi besar setiap kali travel agen yang Anda referensikan mendaftar di afiliasi.travelboost.co.id. Gratis, mudah, dan langsung cuan!',
    heroBtn1: 'Daftar Sekarang Gratis!',
    heroBtn2: 'Pelajari Lebih Lanjut',

    whyTitle: 'Mengapa Bergabung sebagai Afiliasi TravelBoost?',
    why1Title: 'Komisi Tinggi',
    why1Desc:
      'Dapatkan komisi menarik setiap kali travel agen yang Anda referensikan melakukan transaksi di platform.',
    why2Title: 'Platform Terpercaya',
    why2Desc:
      'Akses ke platform travel agen lengkap dan terpercaya di travelboost.co.id yang sudah digunakan ribuan agen.',
    why3Title: 'Mulai Tanpa Modal',
    why3Desc:
      'Bergabung mudah, cepat, dan sepenuhnya gratis. Langsung mulai promosi dan hasilkan uang tanpa risiko.',

    marketTag: 'Insight Pasar',
    marketTitle: 'Peluang Besar di Industri Travel Indonesia',
    marketDesc:
      'Industri pariwisata terus bangkit dan tumbuh pesat. Ribuan Travel Agent baru bermunculan dan membutuhkan solusi teknologi. Ini adalah kesempatan emas Anda untuk menawarkan TravelBoost dan meraup cuan dari setiap lisensi yang terjual.',
    marketStat1: 'Triliun Rp',
    marketStat1Desc: 'Potensi Pasar Travel',
    marketStat2: 'Ribuan',
    marketStat2Desc: 'Agen Butuh Digitalisasi',

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
    step4D: 'Komisi masuk wallet & siap ditarik.',

    advTitle: 'Keunggulan Program Afiliasi TravelBoost',
    adv1Title: 'Komisi 10% - 15% Flat & Transparan',
    adv1Desc:
      'Hitungan komisi jelas dari nilai subscription, tanpa potongan tersembunyi.',
    adv2Title: 'Nol Modal, Nol Risiko',
    adv2Desc: 'Tidak perlu beli produk atau biaya pendaftaran. Langsung mulai.',
    adv3Title: 'Pembayaran Otomatis via Wallet',
    adv3Desc:
      'Komisi langsung masuk e-wallet akun Anda segera setelah transaksi agen valid.',
    adv4Title: 'Dashboard Real-Time',
    adv4Desc:
      'Pantau performa referal, jumlah klik, dan total penghasilan Anda secara instan.',
    adv5Title: 'Masa Aktif Cookie Lama',
    adv5Desc: 'Agen mendaftar sebulan kemudian? Anda tetap dapat komisinya.',
    adv6Title: 'Dukungan Marketing Kit',
    adv6Desc:
      'Akses banner promosi, materi konten, dan panduan sukses afiliasi.',

    testiTitle: 'Apa Kata Mereka?',
    testi1:
      'Hanya dalam 2 bulan, penghasilan sampingan saya dari TravelBoost sudah melampaui gaji pokok. Platformnya sangat mudah dipromosikan ke pemilik travel.',
    testi1N: 'Budi Santoso',
    testi1J: 'Afiliator Jakarta',
    testi2:
      'Sistem walletnya juara! Komisi masuk otomatis dan penarikannya sangat cepat. Dukungan tim TravelBoost juga sangat responsif membantu materi promosi.',
    testi2N: 'Rina Wijaya',
    testi2J: 'Blogger Travel, Bali',

    faqTitle: 'Pertanyaan yang Sering Diajukan',
    faq1Q: 'Apakah ada biaya untuk mendaftar?',
    faq1A:
      'Sama sekali tidak. Pendaftaran Program Afiliasi TravelBoost 100% gratis tanpa biaya tersembunyi.',
    faq2Q: 'Kapan dan bagaimana komisi dibayarkan?',
    faq2A:
      'Komisi otomatis masuk ke wallet akun Anda setelah agen membayar subscription. Anda bisa menariknya kapan saja ke rekening bank Anda.',
    faq3Q: 'Berapa lama validasi pendaftaran Agen?',
    faq3A:
      'Proses persetujuan Agen biasanya membutuhkan waktu 1-2 hari kerja untuk memastikan keaslian dokumen travel.',

    ctaTitle: 'Ayo Bergabung Sekarang!',
    ctaDesc:
      'Daftar sekarang, mulai promosikan TravelBoost ke travel agen di sekitar Anda, dan rasakan sendiri bagaimana komisi 10% mengalir ke rekening Anda. Gratis & Cepat.',
    ctaBtn: 'Daftar Afiliasi Sekarang - Gratis!',

    contactTitle: 'Hubungi Kami',
    contactDesc:
      'Tim TravelBoost siap membantu Anda memulai perjalanan afiliasi dan menjawab semua pertanyaan Anda.',
    footerText:
      'Mulai Hari Ini: Bagian dari kesuksesan travel agent Indonesia!',
  },
  en: {
    navHome: 'Home',
    navFeatures: 'Features',
    navSteps: 'How it Works',
    navFaq: 'FAQ',
    navLogin: 'Login',
    navRegister: 'Register',

    heroTitle: 'Earn Attractive Income with TravelBoost Affiliate Program!',
    heroDesc:
      'Become a trusted affiliate partner and earn huge commissions every time a travel agent you refer registers at affiliate.travelboost.co.id. Free, easy, and instant profit!',
    heroBtn1: 'Register Now for Free!',
    heroBtn2: 'Learn More',

    whyTitle: 'Why Join as a TravelBoost Affiliate?',
    why1Title: 'High Commission',
    why1Desc:
      'Get attractive commissions every time a travel agent you refer makes a transaction on the platform.',
    why2Title: 'Trusted Platform',
    why2Desc:
      'Access to a complete and trusted travel agent platform at travelboost.co.id, used by thousands of agents.',
    why3Title: 'Start Without Capital',
    why3Desc:
      'Joining is easy, fast, and completely free. Start promoting instantly and earn money without risk.',

    marketTag: 'Market Insight',
    marketTitle: "Huge Opportunity in Indonesia's Travel Industry",
    marketDesc:
      'The tourism industry continues to rebound and grow rapidly. Thousands of new Travel Agents are emerging and need technology solutions. This is your golden opportunity to offer TravelBoost and earn profits from every license sold.',
    marketStat1: 'Trillion Rp',
    marketStat1Desc: 'Market Potential',
    marketStat2: 'Thousands',
    marketStat2Desc: 'Agents Need Digitalization',

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
    step4D: 'Commission enters wallet & ready to withdraw.',

    advTitle: 'TravelBoost Affiliate Program Advantages',
    adv1Title: 'Flat 10% - 15% Transparent Commission',
    adv1Desc:
      'Clear commission calculation from subscription value, no hidden deductions.',
    adv2Title: 'Zero Capital, Zero Risk',
    adv2Desc: 'No need to buy products or registration fees. Start instantly.',
    adv3Title: 'Automated Wallet Payment',
    adv3Desc:
      'Commissions go straight to your account e-wallet as soon as the agent transaction is valid.',
    adv4Title: 'Real-Time Dashboard',
    adv4Desc:
      'Instantly monitor referral performance, number of clicks, and your total earnings.',
    adv5Title: 'Long Cookie Lifetime',
    adv5Desc: 'Agent registers a month later? You still get the commission.',
    adv6Title: 'Marketing Kit Support',
    adv6Desc:
      'Access promotional banners, content materials, and affiliate success guides.',

    testiTitle: 'What They Say?',
    testi1:
      'In just 2 months, my side income from TravelBoost has surpassed my main salary. The platform is very easy to promote to travel owners.',
    testi1N: 'Budi Santoso',
    testi1J: 'Affiliate Jakarta',
    testi2:
      'The wallet system is a winner! Commissions enter automatically and withdrawals are very fast. TravelBoost team support is also very responsive in helping with promotional materials.',
    testi2N: 'Rina Wijaya',
    testi2J: 'Travel Blogger, Bali',

    faqTitle: 'Frequently Asked Questions',
    faq1Q: 'Is there a fee to register?',
    faq1A:
      'Absolutely not. TravelBoost Affiliate Program registration is 100% free with no hidden fees.',
    faq2Q: 'When and how are commissions paid?',
    faq2A:
      'Commissions are automatically added to your account wallet after the agent pays for the subscription. You can withdraw it anytime to your bank account.',
    faq3Q: 'How long is the Agent registration validation?',
    faq3A:
      'The Agent approval process usually takes 1-2 working days to ensure the authenticity of travel documents.',

    ctaTitle: 'Join Us Now!',
    ctaDesc:
      'Register now, start promoting TravelBoost to travel agents around you, and experience commissions flowing into your account every day. Free & Fast.',
    ctaBtn: 'Register as Affiliate Now - Free!',

    contactTitle: 'Contact Us',
    contactDesc:
      'Ready to Start? Contact Us! The TravelBoost team is ready to help you start your affiliate journey and answer all your questions.',
    footerText: "Start Today: Part of Indonesia's travel agent success!",
  },
};

// --- CSS ANIMASI ---
const animationStyles = `
  @keyframes float {
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(3deg); }
    100% { transform: translateY(0px) rotate(0deg); }
  }
  .animate-float { animation: float 6s ease-in-out infinite; }
  .delay-1 { animation-delay: 1s; }
  .delay-2 { animation-delay: 2s; }
  html { scroll-behavior: smooth; }
`;

// --- KOMPONEN FAQ ---
const FaqItem: React.FC<{ question: string; answer: string }> = ({
  question,
  answer,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-6 text-left group"
      >
        <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors tracking-tight">
          {question}
        </h4>
        <ChevronDown
          className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-6' : 'max-h-0'}`}
      >
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">
          {answer}
        </p>
      </div>
    </div>
  );
};

export default function Landing() {
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [currentDomain, setCurrentDomain] = useState(
    'afiliasi.travelboost.co.id',
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentDomain(window.location.host);
    }

    const sLang = localStorage.getItem('tb_lang') as 'id' | 'en';
    if (sLang) setLang(sLang);

    const sTheme = localStorage.getItem('tb_theme') as 'light' | 'dark';
    if (sTheme === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleLang = () => {
    const n = lang === 'id' ? 'en' : 'id';
    setLang(n);
    localStorage.setItem('tb_lang', n);
  };

  const toggleTheme = () => {
    const n = theme === 'light' ? 'dark' : 'light';
    setTheme(n);
    localStorage.setItem('tb_theme', n);
    document.documentElement.classList.toggle('dark', n === 'dark');
  };

  const t = dict[lang];

  return (
    <>
      <Head title="TravelBoost Affiliate Program" />
      <style>{animationStyles}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30 transition-colors duration-200">
        {/* --- NAVIGASI --- */}
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <a
              href="#home"
              className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-500"
            >
              TB
              <span className="text-slate-900 dark:text-white font-medium">
                Affiliate
              </span>
            </a>

            {/* Menu Desktop */}
            <div className="hidden lg:flex items-center gap-8 font-medium text-sm text-slate-600 dark:text-slate-300">
              <a
                href="#home"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                {t.navHome}
              </a>
              <a
                href="#steps"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                {t.navSteps}
              </a>
              <a
                href="#features"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                {t.navFeatures}
              </a>
              <a
                href="#faq"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                {t.navFaq}
              </a>
            </div>

            {/* Aksi & Toggles */}
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden sm:flex items-center gap-3 mr-2 border-r border-slate-200 dark:border-slate-700 pr-4">
                <a
                  href="/affiliate/login"
                  className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition px-2"
                >
                  {t.navLogin}
                </a>
                <a
                  href="/affiliate/register"
                  className="text-sm font-bold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
                >
                  {t.navRegister}
                </a>
              </div>

              <button
                onClick={toggleLang}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Languages size={18} />
                <span className="text-sm font-bold uppercase hidden sm:block">
                  {lang}
                </span>
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              {/* Menu Hamburger Mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Dropdown Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden absolute top-16 left-0 w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 py-4 px-6 shadow-xl flex flex-col gap-4">
              <a
                href="#home"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-medium"
              >
                {t.navHome}
              </a>
              <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-medium"
              >
                {t.navFeatures}
              </a>
              <a
                href="#steps"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-medium"
              >
                {t.navSteps}
              </a>
              <a
                href="#faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-medium"
              >
                {t.navFaq}
              </a>
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <a
                  href="/login"
                  className="text-center font-bold py-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                >
                  {t.navLogin}
                </a>
                <a
                  href="/register"
                  className="text-center font-bold py-2 bg-blue-600 text-white rounded-lg"
                >
                  {t.navRegister}
                </a>
              </div>
            </div>
          )}
        </nav>

        {/* --- HERO SECTION --- */}
        <section
          id="home"
          className="relative pt-20 pb-28 overflow-hidden bg-white dark:bg-slate-900"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
            <PlaneTakeoff
              className="absolute top-20 left-10 text-blue-600 animate-float"
              size={60}
            />
            <Luggage
              className="absolute bottom-10 right-20 text-blue-600 animate-float delay-1"
              size={80}
            />
            <Hotel
              className="absolute top-1/2 left-1/2 text-blue-600 animate-float delay-2"
              size={50}
            />
          </div>

          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-5 gap-12 items-center relative z-10">
            <div className="lg:col-span-3 space-y-8 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] bg-gradient-to-r from-slate-950 to-slate-800 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                {t.heroTitle}
              </h1>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {t.heroDesc
                  .replace('afiliasi.travelboost.co.id', currentDomain)
                  .replace('affiliate.travelboost.co.id', currentDomain)}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex justify-center items-center gap-2"
                >
                  {t.heroBtn1} <ArrowRight size={18} />
                </a>
                <a
                  href="#features"
                  className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-8 py-4 rounded-xl font-semibold transition-all text-center"
                >
                  {t.heroBtn2}
                </a>
              </div>
            </div>
            <div className="lg:col-span-2 relative hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=600"
                alt="Collaboration"
                className="rounded-3xl object-cover w-full h-auto shadow-2xl border-4 border-white dark:border-slate-800"
              />
            </div>
          </div>
        </section>

        {/* --- PELUANG CUAN (BENTO GRID DESIGN - DIPERBAIKI) --- */}
        <section className="py-20 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-blue-600 dark:bg-blue-900/30 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row">
              {/* Sisi Kiri: Teks (Biru) */}
              <div className="lg:w-1/2 p-10 md:p-14 lg:p-16 flex flex-col justify-center text-white relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/50 dark:bg-blue-500/20 border border-blue-400/30 text-sm font-bold mb-6 w-max shadow-sm">
                  <TrendingUp size={16} /> {t.marketTag}
                </div>

                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6 leading-tight">
                  {t.marketTitle}
                </h2>
                <p className="text-blue-100 text-lg leading-relaxed opacity-90">
                  {t.marketDesc}
                </p>
              </div>

              {/* Sisi Kanan: Stats Card (Putih/Gelap) */}
              <div className="lg:w-1/2 bg-white dark:bg-slate-900 p-8 md:p-14 lg:p-16 flex items-center lg:rounded-l-3xl shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
                <div className="grid sm:grid-cols-2 gap-6 w-full">
                  {[
                    {
                      stat: t.marketStat1,
                      desc: t.marketStat1Desc,
                      icon: <DollarSign size={28} />,
                    },
                    {
                      stat: t.marketStat2,
                      desc: t.marketStat2Desc,
                      icon: <Users size={28} />,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 hover:-translate-y-1 transition-transform duration-300"
                    >
                      <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                        {item.icon}
                      </div>
                      <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                        {item.stat}
                      </div>
                      <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- LANGKAH MUDAH --- */}
        <section id="steps" className="py-28 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-20 space-y-3">
              <h2 className="text-4xl font-extrabold tracking-tight">
                {t.stepTitle}
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                {t.stepDesc}
              </p>
            </div>

            <div className="relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 hidden lg:block -translate-y-1/2 z-0"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 relative z-10">
                {[
                  {
                    icon: <UserPlus size={28} />,
                    title: t.step1,
                    desc: t.step1D,
                  },
                  {
                    icon: <LinkIcon size={28} />,
                    title: t.step2,
                    desc: t.step2D,
                  },
                  {
                    icon: <Megaphone size={28} />,
                    title: t.step3,
                    desc: t.step3D,
                  },
                  {
                    icon: <DollarSign size={28} />,
                    title: t.step4,
                    desc: t.step4D,
                  },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl text-center flex flex-col items-center border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors relative"
                  >
                    <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                      {step.icon}
                    </div>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-full w-10 h-10 flex items-center justify-center font-bold text-blue-600">
                      {i + 1}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- KEUNGGULAN --- */}
        <section
          id="features"
          className="py-24 bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800/50"
        >
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-extrabold tracking-tight text-center mb-16">
              {t.advTitle}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <PieChart />, title: t.adv1Title, desc: t.adv1Desc },
                {
                  icon: <BriefcaseBusiness />,
                  title: t.adv2Title,
                  desc: t.adv2Desc,
                },
                { icon: <DollarSign />, title: t.adv3Title, desc: t.adv3Desc },
                { icon: <PieChart />, title: t.adv4Title, desc: t.adv4Desc },
                { icon: <Users />, title: t.adv5Title, desc: t.adv5Desc },
                { icon: <ShieldCheck />, title: t.adv6Title, desc: t.adv6Desc },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex gap-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0 mt-1 text-blue-600 dark:text-blue-400">
                    {React.cloneElement(item.icon, { size: 28 })}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- TESTIMONI --- */}
        <section className="py-24 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-extrabold tracking-tight text-center mb-16">
              {t.testiTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-10">
              {[
                { quote: t.testi1, name: t.testi1N, job: t.testi1J },
                { quote: t.testi2, name: t.testi2N, job: t.testi2J },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-slate-50 dark:bg-slate-800/50 p-10 rounded-3xl relative"
                >
                  <MessageSquareQuote
                    className="absolute -top-5 -left-5 text-blue-100 dark:text-blue-900/50"
                    size={60}
                  />
                  <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed italic mb-8 relative z-10">
                    "{item.quote}"
                  </p>
                  <div className="flex items-center gap-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-xl">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {item.job}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- FAQ --- */}
        <section
          id="faq"
          className="py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/50"
        >
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-4xl font-extrabold tracking-tight text-center mb-16">
              {t.faqTitle}
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
              <FaqItem question={t.faq1Q} answer={t.faq1A} />
              <FaqItem question={t.faq2Q} answer={t.faq2A} />
              <FaqItem question={t.faq3Q} answer={t.faq3A} />
            </div>
          </div>
        </section>

        {/* --- CTA --- */}
        <section className="py-24 bg-white dark:bg-slate-900">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="bg-blue-600 rounded-[2.5rem] p-10 md:p-16 lg:p-20 shadow-2xl shadow-blue-600/20 text-white relative overflow-hidden">
              <PlaneTakeoff
                className="absolute -bottom-10 -left-10 text-blue-700 opacity-50"
                size={150}
              />
              <div className="relative z-10 space-y-8">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">
                  {t.ctaTitle}
                </h2>
                <p className="text-blue-100 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
                  {t.ctaDesc}
                </p>
                <a
                  href="/register"
                  className="inline-block bg-white text-blue-600 hover:bg-slate-50 px-10 py-5 rounded-2xl font-bold transition-all active:scale-95 shadow-xl text-lg"
                >
                  {t.ctaBtn}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/50 pt-16 pb-8 text-sm text-slate-600 dark:text-slate-400">
          <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
            <div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
                {t.contactTitle}
              </h3>
              <p className="mb-6 max-w-xl mx-auto leading-relaxed">
                {t.contactDesc}
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6 font-medium text-slate-800 dark:text-slate-200">
                <a href="#" className="hover:text-blue-600 transition">
                  WhatsApp: +62 812-XXXX-XXXX
                </a>
                <span className="hidden sm:block text-slate-300 dark:text-slate-700">
                  |
                </span>
                <a href="#" className="hover:text-blue-600 transition">
                  dev.travelboost.co.id
                </a>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                TravelBoost
              </div>
              <p className="font-medium text-slate-500">
                &copy; {new Date().getFullYear()}. {t.footerText}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
