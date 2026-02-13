'use client';

import StdLayout from '@/components/layouts/std-layout';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

export default function About() {
  return (
    <StdLayout>
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-20 text-center">
          <h1 className="mb-6 text-5xl font-bold text-foreground md:text-6xl">
            Tentang <span className="text-primary">TravelBoost</span>
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-foreground/70">
            Kami adalah mitra terpercaya yang berkomitmen untuk membantu agen
            perjalanan berkembang dan mencapai kesuksesan mereka.
          </p>
        </div>

        {/* Our Story */}
        <div className="mb-20 grid items-center gap-12 md:grid-cols-2">
          <div className="relative flex h-96 items-center justify-center rounded-lg border border-secondary/30 bg-secondary/20">
            <svg
              className="h-32 w-32 text-primary/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h2 className="mb-6 text-4xl font-bold text-foreground">
              Cerita Kami
            </h2>
            <p className="mb-4 text-lg leading-relaxed text-foreground/70">
              TravelBoost didirikan dengan visi untuk merevolusi cara agen
              perjalanan mempromosikan layanan mereka. Kami memahami tantangan
              yang dihadapi industri perjalanan di Indonesia dan berkomitmen
              untuk memberikan solusi yang inovatif dan terpercaya.
            </p>
            <p className="text-lg leading-relaxed text-foreground/70">
              Melalui platform kami, ribuan agen perjalanan telah meningkatkan
              jangkauan pasar mereka dan mencapai pertumbuhan bisnis yang
              signifikan.
            </p>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="mb-20 grid gap-8 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-8">
            <h3 className="mb-4 text-2xl font-bold text-foreground">
              Misi Kami
            </h3>
            <p className="leading-relaxed text-foreground/70">
              Memberdayakan agen perjalanan Indonesia dengan teknologi modern
              dan solusi pemasaran yang efektif, sehingga mereka dapat fokus
              pada pertumbuhan bisnis dan kepuasan pelanggan.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-8">
            <h3 className="mb-4 text-2xl font-bold text-foreground">
              Visi Kami
            </h3>
            <p className="leading-relaxed text-foreground/70">
              Menjadi platform terdepan di Asia Tenggara untuk promosi dan
              manajemen agen perjalanan, menciptakan ekosistem bisnis yang
              berkelanjutan dan menguntungkan.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div>
          <h2 className="mb-12 text-center text-4xl font-bold text-foreground">
            Nilai-Nilai Inti Kami
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                title: 'Kepercayaan',
                desc: 'Integritas dan transparansi dalam setiap interaksi',
                icon: '🤝',
              },
              {
                title: 'Inovasi',
                desc: 'Terus berkembang dan mencari solusi terbaik',
                icon: '💡',
              },
              {
                title: 'Komitmen',
                desc: 'Dedikasi penuh untuk kesuksesan mitra kami',
                icon: '⭐',
              },
              {
                title: 'Kolaborasi',
                desc: 'Bekerja bersama untuk mencapai tujuan bersama',
                icon: '🌍',
              },
            ].map((value, idx) => (
              <div key={idx} className="p-6 text-center">
                <div className="mb-4 text-5xl">{value.icon}</div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">
                  {value.title}
                </h3>
                <p className="text-foreground/70">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="mx-auto max-w-7xl border-t border-border px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="mb-12 text-center text-4xl font-bold text-foreground">
          Tim Kami
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              name: 'Budi Santoso',
              role: 'Pendiri & CEO',
              desc: 'Dengan 15+ tahun pengalaman di industri travel',
            },
            {
              name: 'Sinta Wijaya',
              role: 'Kepala Produk',
              desc: 'Berdedikasi untuk inovasi dan pengalaman pengguna',
            },
            {
              name: 'Ahmad Rahman',
              role: 'Kepala Teknologi',
              desc: 'Ahli dalam teknologi cloud dan scalability',
            },
          ].map((member, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-card p-8 text-center transition hover:border-primary/50"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                <span className="text-4xl">👤</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                {member.name}
              </h3>
              <p className="mb-2 font-medium text-primary">{member.role}</p>
              <p className="text-foreground/70">{member.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-12 text-center">
          <h2 className="mb-6 text-4xl font-bold text-foreground">
            Siap Bergabung dengan Kami?
          </h2>
          <p className="mb-8 text-lg text-foreground/70">
            Hubungi tim kami hari ini untuk mengetahui bagaimana TravelBoost
            dapat membantu mengembangkan bisnis Anda.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link href="/contact">Hubungi Kami</Link>
          </Button>
        </div>
      </section>
    </StdLayout>
  );
}
