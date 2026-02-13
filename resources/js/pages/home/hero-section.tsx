import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { Globe, Sparkles, Users } from 'lucide-react';
import React from 'react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16">
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-travel.jpg"
          alt="Beautiful tropical destination"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-georgia font-bold text-card leading-tight">
            Selamat Datang di TravelBoost: Platform Promosi Agen Perjalanan
            Terbaik Anda
          </h1>

          <p className="mt-6 text-lg md:text-xl text-card/90 leading-relaxed">
            Buka kemungkinan baru untuk bisnis perjalanan Anda. TravelBoost
            memberdayakan agen perjalanan dengan alat canggih untuk sukses.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="text-base">
              <Link href="/register">Daftar Sekarang</Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-base bg-card/10 border-card/30 text-card hover:bg-card/20"
            >
              <Link href="/login">Masuk</Link>
            </Button>
          </div>
        </div>

        {/* FEATURE CARDS */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Sparkles className="w-8 h-8" />}
            title="Mengubah Impian Menjadi Perjalanan"
            description="Promosikan penawaran yang luar biasa, mewujudkan impian pelanggan Anda menjadi pengalaman perjalanan tak terlupakan."
          />

          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Pemberdayaan Agen"
            description="Alat canggih TravelBoost memungkinkan agen untuk dengan mudah mengelola dan mempromosikan penawaran mereka."
          />

          <FeatureCard
            icon={<Globe className="w-8 h-8" />}
            title="Konektivitas Global"
            description="Jangkau audiens di seluruh dunia, memperluas jangkauan bisnis Anda dan menciptakan peluang baru."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card/10 backdrop-blur-sm border border-card/20 rounded-xl p-6 text-card">
      <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center text-primary-foreground mb-4">
        {icon}
      </div>

      <h3 className="text-lg font-semibold mb-2 font-playfair-display">
        {title}
      </h3>

      <p className="text-card/80 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
