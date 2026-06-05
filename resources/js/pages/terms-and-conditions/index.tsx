'use client';

import StdLayout from '@/components/layouts/std-layout';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

export default function TermsAndConditions() {
    return (
        <StdLayout>
            <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                <div className="mb-12 text-center">
                    <h1 className="mb-6 text-5xl font-bold text-foreground md:text-6xl">
                        Syarat <span className="text-primary">& Ketentuan</span>
                    </h1>
                    <p className="text-lg text-foreground/70">
                        Berlaku untuk penggunaan situs dan layanan TravelBoost ·
                        Terakhir diperbarui: 3 Juni 2026
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
                            Syarat dan Ketentuan ini (&quot;Ketentuan&quot;)
                            mengatur akses dan penggunaan Anda terhadap situs
                            web, aplikasi, dan layanan yang dioperasikan oleh{' '}
                            <strong className="text-foreground">
                                PT. Erasoft Teknologi Indonesia
                            </strong>{' '}
                            (&quot;Kami&quot;, &quot;TravelBoost&quot;) melalui
                            domain resmi termasuk{' '}
                            <strong className="text-foreground">
                                travelboost.co.id
                            </strong>{' '}
                            serta subdomain terkait.
                        </p>
                        <p className="mt-4 leading-relaxed text-foreground/70">
                            Dengan mengakses atau menggunakan layanan
                            TravelBoost, Anda menyatakan telah membaca,
                            memahami, dan menyetujui Ketentuan ini. Jika Anda
                            tidak setuju, hentikan penggunaan layanan kami.
                        </p>
                        <p className="mt-4 leading-relaxed text-foreground/70">
                            Pendaftaran sebagai{' '}
                            <strong className="text-foreground">
                                Agen Perjalanan
                            </strong>{' '}
                            atau{' '}
                            <strong className="text-foreground">
                                Afiliator
                            </strong>{' '}
                            dapat memerlukan persetujuan tambahan pada saat
                            registrasi. Ketentuan khusus tersebut melengkapi
                            dokumen ini dan berlaku untuk peran tersebut.
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            1. Definisi
                        </h2>
                        <ul className="list-inside list-disc space-y-2 text-foreground/70">
                            <li>
                                <strong className="text-foreground">
                                    Pengguna:
                                </strong>{' '}
                                setiap orang atau badan hukum yang mengakses
                                platform, termasuk konsumen, agen, vendor, dan
                                afiliator.
                            </li>
                            <li>
                                <strong className="text-foreground">
                                    Agen / Mitra:
                                </strong>{' '}
                                pengguna berlangganan yang menjual paket wisata
                                melalui platform.
                            </li>
                            <li>
                                <strong className="text-foreground">
                                    Vendor:
                                </strong>{' '}
                                penyedia paket wisata atau layanan terkait yang
                                terdaftar di sistem.
                            </li>
                            <li>
                                <strong className="text-foreground">
                                    Konsumen:
                                </strong>{' '}
                                pembeli akhir paket wisata melalui situs atau
                                kanal agen.
                            </li>
                            <li>
                                <strong className="text-foreground">
                                    Layanan:
                                </strong>{' '}
                                seluruh fitur digital TravelBoost, termasuk
                                pemesanan, pembayaran, dompet (wallet), laporan,
                                dan integrasi pihak ketiga yang kami sediakan.
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            2. Akun dan Keamanan
                        </h2>
                        <ul className="list-inside list-disc space-y-2 text-foreground/70">
                            <li>
                                Anda wajib memberikan informasi yang benar,
                                lengkap, dan terkini saat membuat atau
                                memelihara akun.
                            </li>
                            <li>
                                Anda bertanggung jawab menjaga kerahasiaan
                                kredensial akun dan semua aktivitas yang terjadi
                                di bawah akun Anda.
                            </li>
                            <li>
                                Segera beri tahu Kami jika Anda mencurigai akses
                                tidak sah atau penyalahgunaan akun.
                            </li>
                            <li>
                                Kami berhak menolak, menangguhkan, atau menutup
                                akun yang melanggar Ketentuan atau peraturan
                                yang berlaku.
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            3. Penggunaan Layanan
                        </h2>
                        <p className="mb-4 leading-relaxed text-foreground/70">
                            Anda setuju untuk:
                        </p>
                        <ul className="mb-4 list-inside list-disc space-y-2 text-foreground/70">
                            <li>
                                Menggunakan Layanan hanya untuk tujuan yang sah
                                dan sesuai peraturan di Indonesia.
                            </li>
                            <li>
                                Tidak mengganggu, merusak, atau mencoba
                                mengakses sistem secara tidak sah.
                            </li>
                            <li>
                                Tidak menyalin, menjual kembali, atau
                                mengeksploitasi bagian platform tanpa izin
                                tertulis dari Kami.
                            </li>
                            <li>
                                Menghormati merek, konten, dan hak pihak ketiga
                                yang tampil di platform.
                            </li>
                        </ul>
                        <p className="leading-relaxed text-foreground/70">
                            Kami dapat membatasi atau menghentikan akses jika
                            terdapat indikasi penipuan, manipulasi harga,
                            penyalahgunaan data, atau aktivitas yang merugikan
                            pengguna lain atau reputasi TravelBoost.
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            4. Pemesanan, Vendor, dan Tanggung Jawab
                        </h2>
                        <p className="mb-4 leading-relaxed text-foreground/70">
                            TravelBoost menyediakan infrastruktur teknologi
                            untuk penayangan, pemesanan, dan administrasi
                            transaksi paket wisata. Untuk sebagian besar
                            transaksi:
                        </p>
                        <ul className="list-inside list-disc space-y-2 text-foreground/70">
                            <li>
                                Informasi produk (jadwal, harga, kuota, syarat
                                pembatalan) disediakan oleh Vendor atau Agen
                                sesuai data di sistem.
                            </li>
                            <li>
                                Pelaksanaan perjalanan, kualitas layanan di
                                lapangan, dan kepatuhan operasional utama berada
                                pada Vendor dan/atau Agen terkait.
                            </li>
                            <li>
                                Kebijakan pembatalan, reschedule, dan refund
                                mengikuti ketentuan yang ditampilkan pada saat
                                pemesanan dan kebijakan Vendor yang berlaku.
                            </li>
                            <li>
                                Kami berupaya menjaga keakuratan data, namun
                                tidak menjamin bahwa seluruh informasi bebas
                                dari kesalahan teknis atau perubahan mendadak di
                                luar kendali Kami.
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            5. Pembayaran dan Dompet Digital
                        </h2>
                        <ul className="list-inside list-disc space-y-2 text-foreground/70">
                            <li>
                                Pembayaran dapat diproses melalui kanal resmi
                                yang terintegrasi di platform (termasuk payment
                                gateway dan/atau dompet digital TravelBoost).
                            </li>
                            <li>
                                Biaya, pajak, dan kewajiban perpajakan yang
                                timbul dari transaksi Anda mengikuti peraturan
                                yang berlaku, kecuali dinyatakan lain secara
                                tertulis.
                            </li>
                            <li>
                                Penarikan saldo, komisi, atau dana lain
                                mengikuti kebijakan minimum, jadwal, dan
                                verifikasi yang berlaku di sistem pada saat
                                permintaan dilakukan.
                            </li>
                            <li>
                                Kami berhak menahan atau meninjau transaksi yang
                                dicurigai melanggar hukum, kebijakan internal,
                                atau instruksi regulator.
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            6. Hak Kekayaan Intelektual
                        </h2>
                        <p className="leading-relaxed text-foreground/70">
                            Seluruh merek dagang, logo, desain antarmuka,
                            perangkat lunak, dan materi milik TravelBoost
                            dilindungi hukum. Anda tidak diperkenankan
                            menggunakan aset Kami tanpa izin tertulis. Konten
                            yang Anda unggah tetap milik Anda, namun Anda
                            memberikan Kami lisensi terbatas untuk menampilkan
                            dan memproses konten tersebut sepanjang diperlukan
                            untuk menjalankan Layanan.
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            7. Pembatasan Tanggung Jawab
                        </h2>
                        <p className="mb-4 leading-relaxed text-foreground/70">
                            Layanan disediakan &quot;sebagaimana adanya&quot;
                            dalam batas yang diizinkan hukum. Sejauh diizinkan
                            hukum yang berlaku, Kami tidak bertanggung jawab
                            atas:
                        </p>
                        <ul className="list-inside list-disc space-y-2 text-foreground/70">
                            <li>
                                Gangguan layanan akibat pemeliharaan, force
                                majeure, atau kegagalan infrastruktur pihak
                                ketiga.
                            </li>
                            <li>
                                Kerugian tidak langsung, kehilangan keuntungan,
                                atau kerugian reputasi akibat penggunaan atau
                                ketidakmampuan menggunakan Layanan.
                            </li>
                            <li>
                                Sengketa antara Agen, Vendor, Afiliator, dan
                                Konsumen terkait pelaksanaan perjalanan, kecuali
                                Kami secara tegas menyatakan tanggung jawab
                                tertentu secara tertulis.
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            8. Privasi dan Perlindungan Data
                        </h2>
                        <p className="leading-relaxed text-foreground/70">
                            Pengumpulan dan penggunaan data pribadi diatur dalam{' '}
                            <Link
                                href="/privacy"
                                className="font-semibold text-primary underline-offset-4 hover:underline"
                            >
                                Kebijakan Privasi
                            </Link>{' '}
                            kami. Dengan menggunakan Layanan, Anda juga memahami
                            bahwa pemrosesan data dapat melibatkan mitra
                            teknologi (misalnya penyedia pembayaran atau
                            analitik) sesuai kebijakan privasi dan perjanjian
                            kerahasiaan yang berlaku.
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            9. Penghentian Layanan
                        </h2>
                        <p className="leading-relaxed text-foreground/70">
                            Anda dapat berhenti menggunakan Layanan kapan saja
                            dengan menutup akun sesuai prosedur yang tersedia.
                            Kami dapat menangguhkan atau mengakhiri akses Anda
                            jika terjadi pelanggaran Ketentuan, risiko keamanan,
                            atau kewajiban hukum. Ketentuan yang secara wajar
                            harus tetap berlaku setelah penghentian (misalnya
                            kewajiban pembayaran, sengketa, dan kerahasiaan)
                            akan tetap mengikat.
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            10. Perubahan Ketentuan
                        </h2>
                        <p className="leading-relaxed text-foreground/70">
                            Kami dapat memperbarui Ketentuan ini dari waktu ke
                            waktu. Perubahan material akan diinformasikan
                            melalui situs, aplikasi, email, atau kanal resmi
                            lainnya. Penggunaan berkelanjutan setelah tanggal
                            berlaku dianggap sebagai persetujuan Anda terhadap
                            versi terbaru.
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-8">
                        <h2 className="mb-4 text-2xl font-bold text-foreground">
                            11. Hukum yang Berlaku dan Kontak
                        </h2>
                        <p className="mb-4 leading-relaxed text-foreground/70">
                            Ketentuan ini diatur oleh hukum Negara Republik
                            Indonesia. Sengketa akan diupayakan diselesaikan
                            terlebih dahulu melalui musyawarah; jika tidak
                            tercapai kesepakatan, penyelesaian dilakukan melalui
                            pengadilan yang berwenang di domisili hukum PT.
                            Erasoft Teknologi Indonesia.
                        </p>
                        <div className="space-y-2 text-foreground/70">
                            <p>
                                <strong className="text-foreground">
                                    Email:
                                </strong>{' '}
                                legal@travelboost.co.id
                            </p>
                            <p>
                                <strong className="text-foreground">
                                    Perusahaan:
                                </strong>{' '}
                                PT. Erasoft Teknologi Indonesia
                            </p>
                            <p>
                                <strong className="text-foreground">
                                    Domisili:
                                </strong>{' '}
                                Indonesia
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-12 text-center">
                    <h2 className="mb-6 text-3xl font-bold text-foreground">
                        Butuh penjelasan lebih lanjut?
                    </h2>
                    <p className="mb-8 text-lg text-foreground/70">
                        Tim kami siap membantu pertanyaan terkait Syarat &
                        Ketentuan atau Kebijakan Privasi.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button
                            asChild
                            size="lg"
                            className="bg-primary hover:bg-primary/90"
                        >
                            <Link href="/contact">Hubungi Kami</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link href="/privacy">Kebijakan Privasi</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </StdLayout>
    );
}
