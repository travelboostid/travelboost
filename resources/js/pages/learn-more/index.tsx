'use client';
import StdLayout from '@/components/layouts/std-layout';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

export default function LearnMore() {
  return (
    <StdLayout>
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-5xl font-bold text-balance text-foreground md:text-6xl">
            Fitur Platform <span className="text-primary">TravelBoost</span>
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-foreground/70">
            Jelajahi solusi lengkap untuk mengelola, mempromosikan, dan
            mengembangkan bisnis perjalanan Anda
          </p>
        </div>
      </section>

      {/* Vendor Management Section */}
      <section className="mx-auto max-w-7xl border-t border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-20 grid items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="mb-6 text-4xl font-bold text-foreground">
              Portal Vendor Perjalanan
            </h2>
            <p className="mb-6 text-lg leading-relaxed text-foreground/70">
              TravelBoost menghubungkan vendor perjalanan terpercaya dengan agen
              yang mencari paket berkualitas. Vendor dapat mendaftarkan dan
              mengelola paket tour mereka dengan mudah.
            </p>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <span className="font-bold text-primary">✓</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">
                    Daftar Paket Lengkap
                  </h3>
                  <p className="text-foreground/70">
                    Kelola destinasi, harga, jadwal, dan detail paket dengan
                    dashboard intuitif
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <span className="font-bold text-primary">✓</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">
                    Visibilitas Maksimal
                  </h3>
                  <p className="text-foreground/70">
                    Paket Anda tampil kepada ribuan agen perjalanan di seluruh
                    Indonesia
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <span className="font-bold text-primary">✓</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">
                    Real-time Analytics
                  </h3>
                  <p className="text-foreground/70">
                    Pantau performa paket dengan metrik terperinci dan laporan
                    mendalam
                  </p>
                </div>
              </div>
            </div>
          </div>
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Agent Selection Section */}
      <section className="mx-auto max-w-7xl border-t border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="relative order-2 flex h-96 items-center justify-center rounded-lg border border-secondary/30 bg-secondary/20 md:order-1">
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
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="mb-6 text-4xl font-bold text-foreground">
              Kurasi Paket untuk Agen
            </h2>
            <p className="mb-6 text-lg leading-relaxed text-foreground/70">
              Agen perjalanan dapat dengan mudah menelusuri dan memilih paket
              tour yang sesuai dari ribuan penawaran vendor terpercaya. Sistem
              rekomendasi kami membantu menemukan paket ideal.
            </p>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <span className="font-bold text-primary">✓</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">
                    Filter & Pencarian Canggih
                  </h3>
                  <p className="text-foreground/70">
                    Cari berdasarkan destinasi, budget, durasi, dan preferensi
                    spesifik lainnya
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <span className="font-bold text-primary">✓</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">
                    Kolaborasi dengan Vendor
                  </h3>
                  <p className="text-foreground/70">
                    Negosiasikan harga khusus dan dapatkan komisi kompetitif
                    untuk setiap booking
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <span className="font-bold text-primary">✓</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">
                    Tracking Pesanan Real-time
                  </h3>
                  <p className="text-foreground/70">
                    Monitor status booking dari pemesanan hingga pelaksanaan
                    perjalanan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAX Management Section */}
      <section className="mx-auto max-w-7xl border-t border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground">
            Manajemen PAX & Sinkronisasi Stok
          </h2>
          <p className="text-xl text-foreground/70">
            Sistem otomatis yang mengelola kapasitas penumpang dan ketersediaan
            paket secara real-time
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: 'Tracking Kapasitas Dinamis',
              desc: 'Pantau jumlah penumpang (PAX) yang tersedia untuk setiap paket. Sistem kami secara otomatis memperbarui kapasitas saat ada pemesanan baru.',
              icon: '📊',
            },
            {
              title: 'Sinkronisasi Stok Instan',
              desc: 'Ketika agen membuat booking, stok paket langsung tersinkronisasi di semua platform. Tidak ada overbooking atau konflik data.',
              icon: '🔄',
            },
            {
              title: 'Notifikasi Kapasitas',
              desc: 'Dapatkan alert ketika stok menipis atau paket hampir penuh. Atur tingkat inventori minimum secara otomatis.',
              icon: '⚠️',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-card p-8 transition hover:border-primary/50"
            >
              <div className="mb-4 text-5xl">{feature.icon}</div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-foreground/70">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Customizable Landing Page Section */}
      <section className="mx-auto max-w-7xl border-t border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="mb-6 text-4xl font-bold text-foreground">
              Landing Page yang Dapat Disesuaikan
            </h2>
            <p className="mb-6 text-lg leading-relaxed text-foreground/70">
              Setiap agen mendapat landing page profesional yang dapat
              dikustomisasi sepenuhnya. Tampilkan brand Anda dengan gaya unik
              tanpa perlu keahlian teknis.
            </p>
            <div className="mb-8 space-y-4">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <span className="font-bold text-primary">✓</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">
                    Drag & Drop Builder
                  </h3>
                  <p className="text-foreground/70">
                    Buat landing page tanpa coding. Editor visual yang mudah
                    digunakan dengan berbagai template siap pakai
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <span className="font-bold text-primary">✓</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">
                    Branding Lengkap
                  </h3>
                  <p className="text-foreground/70">
                    Unggah logo, warna brand, foto, dan konten sendiri untuk
                    menciptakan identitas unik
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <span className="font-bold text-primary">✓</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">
                    Domain Khusus
                  </h3>
                  <p className="text-foreground/70">
                    Gunakan domain pribadi Anda atau domain TravelBoost dengan
                    subdomain unik
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <span className="font-bold text-primary">✓</span>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">
                    SEO Terintegrasi
                  </h3>
                  <p className="text-foreground/70">
                    Tools SEO bawaan untuk membantu landing page Anda tampil di
                    pencarian Google
                  </p>
                </div>
              </div>
            </div>
          </div>
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Integration Features */}
      <section className="mx-auto max-w-7xl border-t border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-foreground">
            Fitur Tambahan Platform
          </h2>
          <p className="text-xl text-foreground/70">
            Semua yang Anda butuhkan untuk menjalankan bisnis perjalanan yang
            sukses
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {[
            {
              title: 'Sistem Pembayaran Terintegrasi',
              desc: 'Terima pembayaran dari berbagai metode: transfer bank, kartu kredit, e-wallet, dan cicilan tanpa risiko.',
            },
            {
              title: 'CRM & Manajemen Pelanggan',
              desc: 'Kelola data pelanggan, komunikasi, dan history pembelian dalam satu platform terpusat.',
            },
            {
              title: 'Marketing Automation',
              desc: 'Kirim email, SMS, dan notifikasi otomatis untuk follow-up pemesanan dan promosi paket terbaru.',
            },
            {
              title: 'Analytics & Reporting',
              desc: 'Dashboard lengkap dengan metrik penjualan, konversi, ROI, dan insights untuk optimasi bisnis.',
            },
            {
              title: 'Mobile App',
              desc: 'Aplikasi mobile untuk iOS dan Android agar agen dapat mengelola booking di mana saja, kapan saja.',
            },
            {
              title: 'Dukungan Multi-bahasa',
              desc: 'Platform mendukung berbagai bahasa untuk menjangkau pasar regional dan internasional dengan mudah.',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-card p-6 transition hover:border-primary/50"
            >
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-foreground/70">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-12">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-6 text-4xl font-bold text-foreground">
                Siap Memulai?
              </h2>
              <p className="mb-8 text-lg text-foreground/70">
                Bergabunglah dengan ribuan agen perjalanan yang telah
                mempercayai TravelBoost untuk mengembangkan bisnis mereka.
                Hubungi tim kami untuk demo gratis dan konsultasi bisnis.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                <Link href="/contact">Hubungi Tim Kami</Link>
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <h3 className="font-semibold text-foreground">Setup Cepat</h3>
                  <p className="text-sm text-foreground/70">
                    Aktifkan akun Anda dalam hitungan menit
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <h3 className="font-semibold text-foreground">
                    ROI Terbukti
                  </h3>
                  <p className="text-sm text-foreground/70">
                    Tingkatkan penjualan hingga 300% dalam 6 bulan pertama
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Support 24/7
                  </h3>
                  <p className="text-sm text-foreground/70">
                    Tim ahli siap membantu kesuksesan Anda setiap saat
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StdLayout>
  );
}
