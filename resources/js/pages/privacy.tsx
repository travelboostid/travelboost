'use client';

import StdLayout from '@/components/layouts/std-layout';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

export default function Privacy() {
  return (
    <StdLayout>
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="mb-6 text-5xl font-bold text-foreground md:text-6xl">
            Kebijakan <span className="text-primary">Privasi</span>
          </h1>
          <p className="text-lg text-foreground/70">
            Efektif sejak 1 Januari 2024
          </p>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="prose prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <div className="rounded-lg border border-border bg-card p-8">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              Pendahuluan
            </h2>
            <p className="leading-relaxed text-foreground/70">
              TravelBoost ("kami", "kami", atau "Perusahaan") mengoperasikan
              situs web https://travelboost.co.id. Halaman ini menginformasikan
              Anda tentang kebijakan privasi kami mengenai pengumpulan,
              penggunaan, dan pengungkapan data pribadi Anda ketika Anda
              menggunakan Layanan kami.
            </p>
          </div>

          {/* Data Collection */}
          <div className="rounded-lg border border-border bg-card p-8">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              1. Pengumpulan Data
            </h2>
            <p className="mb-4 leading-relaxed text-foreground/70">
              Kami mengumpulkan informasi yang Anda berikan secara langsung
              kepada kami, seperti ketika Anda:
            </p>
            <ul className="list-inside list-disc space-y-2 text-foreground/70">
              <li>Mendaftar untuk akun TravelBoost</li>
              <li>Menghubungi kami melalui formulir kontak</li>
              <li>Melakukan transaksi atau membayar layanan</li>
              <li>Mengikuti komunikasi pemasaran kami</li>
              <li>Mengirimkan pertanyaan atau permintaan dukungan</li>
            </ul>
          </div>

          {/* Types of Data */}
          <div className="rounded-lg border border-border bg-card p-8">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              2. Jenis Data yang Dikumpulkan
            </h2>
            <div className="space-y-4 text-foreground/70">
              <div>
                <h3 className="mb-2 font-semibold text-foreground">
                  Data Pribadi
                </h3>
                <p>
                  Nama, alamat email, nomor telepon, alamat bisnis, dan
                  informasi bisnis lainnya yang relevan.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-foreground">
                  Data Penggunaan
                </h3>
                <p>
                  Informasi tentang cara Anda menggunakan layanan kami, termasuk
                  riwayat akses dan fitur yang digunakan.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-foreground">
                  Data Teknis
                </h3>
                <p>
                  Alamat IP, jenis browser, sistem operasi, dan data teknis
                  lainnya yang dikumpulkan melalui cookies dan teknologi serupa.
                </p>
              </div>
            </div>
          </div>

          {/* Usage of Data */}
          <div className="rounded-lg border border-border bg-card p-8">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              3. Penggunaan Data
            </h2>
            <p className="mb-4 leading-relaxed text-foreground/70">
              Kami menggunakan data yang dikumpulkan untuk:
            </p>
            <ul className="list-inside list-disc space-y-2 text-foreground/70">
              <li>Menyediakan dan meningkatkan layanan kami</li>
              <li>Memproses transaksi dan pembayaran</li>
              <li>Mengirimkan komunikasi penting terkait akun Anda</li>
              <li>Memberikan dukungan pelanggan</li>
              <li>
                Mengirimkan newsletter dan promosi (dengan persetujuan Anda)
              </li>
              <li>Menganalisis penggunaan layanan untuk perbaikan</li>
              <li>Mencegah penipuan dan melindungi keamanan</li>
            </ul>
          </div>

          {/* Data Security */}
          <div className="rounded-lg border border-border bg-card p-8">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              4. Keamanan Data
            </h2>
            <p className="leading-relaxed text-foreground/70">
              Kami mengambil langkah-langkah yang wajar secara teknis dan
              organisasi untuk melindungi data pribadi Anda dari akses tidak
              sah, perubahan, pengungkapan, atau penghancuran yang tidak sah.
              Namun, tidak ada metode transmisi melalui Internet atau metode
              penyimpanan elektronik yang 100% aman.
            </p>
          </div>

          {/* User Rights */}
          <div className="rounded-lg border border-border bg-card p-8">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              5. Hak Anda
            </h2>
            <p className="mb-4 leading-relaxed text-foreground/70">
              Anda memiliki hak untuk:
            </p>
            <ul className="list-inside list-disc space-y-2 text-foreground/70">
              <li>Mengakses data pribadi yang kami miliki tentang Anda</li>
              <li>Meminta koreksi data yang tidak akurat atau tidak lengkap</li>
              <li>Meminta penghapusan data pribadi Anda</li>
              <li>Menolak komunikasi pemasaran</li>
              <li>Meminta pembatasan pengolahan data Anda</li>
            </ul>
          </div>

          {/* Cookies */}
          <div className="rounded-lg border border-border bg-card p-8">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              6. Cookies
            </h2>
            <p className="leading-relaxed text-foreground/70">
              Kami menggunakan cookies untuk meningkatkan pengalaman pengguna
              Anda. Cookies adalah file kecil yang disimpan di perangkat Anda.
              Anda dapat mengontrol penggunaan cookies melalui pengaturan
              browser Anda. Jika Anda menolak cookies, beberapa fungsi dari
              layanan kami mungkin tidak tersedia.
            </p>
          </div>

          {/* Third Party */}
          <div className="rounded-lg border border-border bg-card p-8">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              7. Pihak Ketiga
            </h2>
            <p className="leading-relaxed text-foreground/70">
              Kami tidak menjual, menukar, atau mentransfer data pribadi Anda
              kepada pihak ketiga tanpa persetujuan Anda, kecuali diwajibkan
              oleh hukum. Kami bekerja dengan penyedia layanan pihak ketiga yang
              membantu kami beroperasi situs web kami dan menjalankan bisnis
              kami di bawah kesepakatan kerahasiaan yang ketat.
            </p>
          </div>

          {/* Contact */}
          <div className="rounded-lg border border-border bg-card p-8">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              8. Hubungi Kami
            </h2>
            <p className="mb-4 leading-relaxed text-foreground/70">
              Jika Anda memiliki pertanyaan tentang kebijakan privasi ini atau
              praktik privasi kami, silakan hubungi kami di:
            </p>
            <div className="space-y-2 text-foreground/70">
              <p>
                <strong className="text-foreground">Email:</strong>{' '}
                privacy@travelboost.co.id
              </p>
              <p>
                <strong className="text-foreground">Telepon:</strong> +62 (0) 21
                XXXX XXXX
              </p>
              <p>
                <strong className="text-foreground">Alamat:</strong> Jakarta,
                Indonesia
              </p>
            </div>
          </div>

          {/* Changes */}
          <div className="rounded-lg border border-border bg-card p-8">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              9. Perubahan Kebijakan
            </h2>
            <p className="leading-relaxed text-foreground/70">
              Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu.
              Perubahan yang signifikan akan dikomunikasikan kepada Anda melalui
              email atau melalui pemberitahuan yang menonjol di situs web kami.
              Penggunaan layanan kami yang berkelanjutan setelah perubahan
              tersebut berarti Anda menerima kebijakan privasi yang diperbarui.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-12 text-center">
          <h2 className="mb-6 text-3xl font-bold text-foreground">
            Pertanyaan tentang Privasi Anda?
          </h2>
          <p className="mb-8 text-lg text-foreground/70">
            Tim kami siap membantu Anda memahami dan mengelola data pribadi
            Anda.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link href="/contact">Hubungi Tim Privasi Kami</Link>
          </Button>
        </div>
      </section>
    </StdLayout>
  );
}
