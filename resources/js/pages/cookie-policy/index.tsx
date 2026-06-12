'use client';

import StdLayout from '@/components/layouts/std-layout';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

const COOKIE_TABLE = [
    {
        name: 'appearance',
        purpose: 'Menyimpan preferensi tampilan (light, dark, atau system).',
        duration: '12 bulan',
        type: 'Fungsional',
    },
    {
        name: 'sidebar_state',
        purpose: 'Menyimpan status sidebar dashboard (terbuka atau tertutup).',
        duration: '7 hari',
        type: 'Fungsional',
    },
    {
        name: 'anonymous_user_token',
        purpose:
            'Mengidentifikasi pengunjung anonim untuk live chat dan fitur chatbot.',
        duration: '12 bulan',
        type: 'Fungsional',
    },
    {
        name: 'Session cookie (Laravel)',
        purpose:
            'Menjaga sesi login Anda tetap aktif saat menggunakan akun TravelBoost.',
        duration: 'Sesi browser',
        type: 'Esensial',
    },
    {
        name: 'XSRF-TOKEN',
        purpose:
            'Melindungi formulir dan permintaan dari serangan cross-site request forgery.',
        duration: 'Sesi browser',
        type: 'Esensial',
    },
];

export default function CookiePolicy() {
    return (
        <StdLayout>
            <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                <div className="mb-12 text-center">
                    <h1 className="mb-6 text-5xl font-bold text-foreground md:text-6xl">
                        Kebijakan <span className="text-primary">Cookie</span>
                    </h1>
                    <p className="text-lg text-foreground/70">
                        Terakhir diperbarui: 12 Juni 2026
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
                <div className="prose prose-invert max-w-none space-y-8">
                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            Pendahuluan
                        </h2>
                        <p className="leading-relaxed text-foreground/70">
                            Kebijakan Cookie ini menjelaskan bagaimana{' '}
                            <strong className="text-foreground">
                                PT Erasoft Teknologi Indonessia
                            </strong>{' '}
                            (&quot;TravelBoost&quot;, &quot;kami&quot;)
                            menggunakan cookie dan teknologi serupa pada situs{' '}
                            <strong className="text-foreground">
                                travelboost.co.id
                            </strong>{' '}
                            serta subdomain terkait.
                        </p>
                        <p className="mt-4 leading-relaxed text-foreground/70">
                            Cookie adalah file kecil yang disimpan di browser
                            atau perangkat Anda saat Anda mengunjungi situs web
                            kami. Cookie membantu kami mengingat preferensi
                            Anda, menjaga keamanan sesi, dan menjalankan fitur
                            platform dengan benar.
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            1. Jenis Cookie yang Kami Gunakan
                        </h2>
                        <div className="space-y-4 text-foreground/70">
                            <div>
                                <h3 className="mb-2 font-semibold text-foreground">
                                    Cookie esensial
                                </h3>
                                <p>
                                    Diperlukan agar situs berfungsi, termasuk
                                    autentikasi akun dan perlindungan keamanan
                                    formulir. Tanpa cookie ini, beberapa layanan
                                    tidak dapat digunakan.
                                </p>
                            </div>
                            <div>
                                <h3 className="mb-2 font-semibold text-foreground">
                                    Cookie fungsional
                                </h3>
                                <p>
                                    Menyimpan pilihan Anda seperti tema
                                    tampilan, preferensi antarmuka dashboard,
                                    dan identitas pengunjung anonim untuk live
                                    chat.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            2. Daftar Cookie
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] border-collapse text-left text-sm text-foreground/70">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="py-3 pr-4 font-semibold text-foreground">
                                            Nama
                                        </th>
                                        <th className="py-3 pr-4 font-semibold text-foreground">
                                            Tujuan
                                        </th>
                                        <th className="py-3 pr-4 font-semibold text-foreground">
                                            Durasi
                                        </th>
                                        <th className="py-3 font-semibold text-foreground">
                                            Jenis
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {COOKIE_TABLE.map((cookie) => (
                                        <tr
                                            key={cookie.name}
                                            className="border-b border-border/60 align-top"
                                        >
                                            <td className="py-4 pr-4 font-medium text-foreground">
                                                {cookie.name}
                                            </td>
                                            <td className="py-4 pr-4">
                                                {cookie.purpose}
                                            </td>
                                            <td className="py-4 pr-4">
                                                {cookie.duration}
                                            </td>
                                            <td className="py-4">
                                                {cookie.type}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            3. Cookie Pihak Ketiga
                        </h2>
                        <p className="leading-relaxed text-foreground/70">
                            Saat Anda menggunakan layanan pembayaran, analitik,
                            atau integrasi eksternal (misalnya payment gateway),
                            penyedia pihak ketiga dapat menetapkan cookie mereka
                            sendiri sesuai kebijakan masing-masing. Kami
                            menyarankan Anda meninjau kebijakan privasi dan
                            cookie penyedia tersebut saat mengakses layanan
                            terkait.
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            4. Cara Mengelola Cookie
                        </h2>
                        <p className="mb-4 leading-relaxed text-foreground/70">
                            Anda dapat mengatur atau menghapus cookie melalui
                            pengaturan browser Anda. Sebagian besar browser
                            memungkinkan Anda untuk:
                        </p>
                        <ul className="list-inside list-disc space-y-2 text-foreground/70">
                            <li>Melihat cookie yang tersimpan</li>
                            <li>Menghapus semua atau sebagian cookie</li>
                            <li>Memblokir cookie dari situs tertentu</li>
                            <li>Memblokir cookie pihak ketiga</li>
                        </ul>
                        <p className="mt-4 leading-relaxed text-foreground/70">
                            Jika Anda menonaktifkan cookie esensial, beberapa
                            fitur seperti login, dashboard, atau live chat
                            mungkin tidak berfungsi dengan baik.
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            5. Perubahan Kebijakan
                        </h2>
                        <p className="leading-relaxed text-foreground/70">
                            Kami dapat memperbarui Kebijakan Cookie ini dari
                            waktu ke waktu untuk mencerminkan perubahan
                            teknologi, fitur, atau persyaratan hukum. Tanggal
                            pembaruan terbaru akan ditampilkan di bagian atas
                            halaman ini.
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            6. Hubungi Kami
                        </h2>
                        <p className="mb-4 leading-relaxed text-foreground/70">
                            Jika Anda memiliki pertanyaan tentang penggunaan
                            cookie di TravelBoost, hubungi kami melalui:
                        </p>
                        <div className="space-y-2 text-foreground/70">
                            <p>
                                <strong className="text-foreground">
                                    Email:
                                </strong>{' '}
                                support@travelboost.co.id
                            </p>
                            <p>
                                <strong className="text-foreground">
                                    Telepon:
                                </strong>{' '}
                                0216349318
                            </p>
                        </div>
                        <p className="mt-4 leading-relaxed text-foreground/70">
                            Informasi lebih lanjut tentang pengolahan data
                            pribadi tersedia di{' '}
                            <Link
                                href="/privacy"
                                className="text-primary hover:underline"
                            >
                                Kebijakan Privasi
                            </Link>
                            .
                        </p>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <Button asChild variant="outline">
                        <Link href="/">Kembali ke Beranda</Link>
                    </Button>
                </div>
            </section>
        </StdLayout>
    );
}
