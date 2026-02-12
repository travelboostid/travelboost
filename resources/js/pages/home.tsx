import StdLayout from '@/components/layouts/std-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import {
  BarChart3,
  ChevronRight,
  Eye,
  FileText,
  Package,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function Home({ x }: { x: number }) {
  return (
    <StdLayout>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <h1 className="mb-6 text-2xl leading-tight font-bold md:text-3xl lg:text-5xl">
          Selamat Datang di TravelBoost: Platform Promosi
          <br />
          Agen Perjalanan Terbaik Anda {x}
        </h1>

        <p className="mb-12 max-w-4xl text-sm text-muted-foreground lg:text-lg">
          Buka kemungkinan baru untuk bisnis perjalanan Anda. TravelBoost
          memberdayakan agen perjalanan dengan cara berikut:
        </p>

        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          <Card className="">
            <CardHeader>
              <img src="https://travelboost.co.id/satu.png" />
              <CardTitle className="text-xl">
                Mengubah Impian Menjadi Perjalanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Promosikan penawaran yang luar biasa, mewujudkan impian
                pelanggan Anda menjadi pengalaman perjalanan tak terlupakan.
              </p>
            </CardContent>
          </Card>
          <Card className="">
            <CardHeader>
              <img src="https://travelboost.co.id/dua.png" />
              <CardTitle className="text-xl">Pemberdayaan Agen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Alat canggih TravelBoost memungkinkan agen untuk dengan mudah
                mengelola dan mempromosikan penawaran mereka.
              </p>
            </CardContent>
          </Card>
          <Card className="">
            <CardHeader>
              <img src="https://travelboost.co.id/tiga.png" />
              <CardTitle className="text-xl">Konektivitas Global</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Jangkau audiens di seluruh dunia, memperluas jangkauan bisnis
                Anda dan menciptakan peluang baru.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/register">
            <Button size="lg" variant="default" className="rounded-full">
              Sign Up
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="rounded-full">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Empowerment Section */}
      <section className="">
        <div className="container mx-auto px-4">
          <h2 className="mb-16 text-2xl font-bold md:text-3xl lg:text-5xl">
            Berdayakan Bisnis Perjalanan Anda Tidak Seperti Sebelumnya
          </h2>

          <div className="relative">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  number: 1,
                  title: 'Pamerkan Tur Eksklusif',
                  description:
                    'Tampilkan tur unik Anda, paket khusus, dan penawaran tak terkalahkan dengan mudah kepada audiens luas para pelancong yang antusias.',
                },
                {
                  number: 2,
                  title: 'Terhubung dengan Pelancong',
                  description:
                    'Berinteraksi langsung dengan klien yang secara aktif mencari saran ahli dan perencanaan perjalanan yang dipersonalisasi, membangun hubungan jangka panjang.',
                },
                {
                  number: 3,
                  title: 'Tingkatkan Visibilitas Merek',
                  description:
                    'Tingkatkan merek Anda dengan alat promosi profesional yang dapat disesuaikan, dirancang untuk membuat agensi Anda menonjol.',
                },
              ].map((step, index) => (
                <Card
                  key={index}
                  className="bg-accent-900/50 relative border-primary pt-12 backdrop-blur-sm"
                >
                  <div className="absolute -top-6 left-8 flex h-12 w-12 items-center justify-center rounded-full bg-primary font-bold text-background">
                    {step.number}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why TravelBoost Section */}
      <section className="py-20">
        <div className="flex gap-20">
          <div className="flex-1">
            <h2 className="mb-16 text-2xl font-bold md:text-3xl lg:text-5xl">
              Mengapa TravelBoost? Keunggulan Agen
            </h2>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {[
                {
                  title: 'Platform Terpusat',
                  description:
                    'Kelola dan promosikan semua produk perjalanan Anda yang beragam dari satu dasbor yang intuitif.',
                  icon: <Package className="h-5 w-5" />,
                },
                {
                  title: 'Real-time & Dapat Disesuaikan',
                  description:
                    'Perbarui konten secara instan tanpa perlu pengetahuan coding, memastikan penawaran Anda selalu terkini.',
                  icon: <Zap className="h-5 w-5" />,
                },
                {
                  title: 'Analitik Berwawasan',
                  description:
                    'Lacak keterlibatan klien dan pantau kinerja penawaran untuk menyempurnakan strategi Anda dan memaksimalkan konversi.',
                  icon: <BarChart3 className="h-5 w-5" />,
                },
              ].map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="justify-center0 mt-1 flex h-6 w-6 flex-shrink-0 items-center text-primary">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="mb-2 text-lg font-semibold">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-72 items-center justify-center rounded-xl">
            <img
              src="https://travelboost.co.id/empat.png"
              className="h-full w-full"
            />
          </div>
        </div>
      </section>

      {/* Visual Section */}
      <section className="container mx-auto px-4">
        <h2 className="mb-8 text-2xl font-bold md:text-3xl lg:text-5xl">
          Visual Menawan yang Menjual Impian
        </h2>

        <p className="mb-12 max-w-4xl text-sm text-muted-foreground lg:text-lg">
          Pikat calon klien dengan gambar yang memukau dan video yang menarik,
          menjadikan aspirasi perjalanan mereka kenyataan yang hidup.
        </p>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {[
            {
              title: 'Media Berkualitas Tinggi',
              description:
                'Unggah foto yang jernih dan video yang imersif untuk menghidupkan destinasi Anda.',
              icon: <Eye className="text-primary0 h-8 w-8" />,
            },
            {
              title: 'Template Siap Pakai',
              description:
                'Manfaatkan template yang dirancang secara profesional, terintegrasi dengan Canva, untuk promosi yang mudah dan berdampak.',
              icon: <FileText className="text-primary0 h-8 w-8" />,
            },
            {
              title: 'Sorot Pengalaman Unik',
              description:
                'Pamerkan segalanya mulai dari kapal pesiar mewah hingga tur petualangan mendebarkan dan liburan budaya yang memperkaya.',
              icon: <Sparkles className="text-primary0 h-8 w-8" />,
            },
          ].map((item, index) => (
            <div key={index}>
              <div className="mb-4">{item.icon}</div>
              <h3 className="mb-3 text-xl font-bold">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Client Engagement Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h1 className="mb-16 text-2xl font-bold md:text-3xl lg:text-5xl">
            Sederhanakan Keterlibatan & Pemesanan Klien
          </h1>

          <div className="flex gap-24">
            <div className="w-100">
              <img
                src="https://travelboost.co.id/lima.png"
                className="w-full rounded-lg"
              />
            </div>

            <div className="flex-1 space-y-12">
              {[
                {
                  number: '01',
                  title: 'Pertanyaan yang Efisien',
                  description:
                    'Formulir terintegrasi memudahkan klien untuk bertanya dan meminta pemesanan.',
                },
                {
                  number: '02',
                  title: 'Notifikasi Otomatis',
                  description:
                    'Tetap terinformasi dengan peringatan real-time, memastikan Anda dan klien Anda selalu sinkron.',
                },
                {
                  number: '03',
                  title: 'Pengalaman yang Dioptimalkan untuk Seluler',
                  description:
                    'Akses TravelBoost kapan saja, di mana saja, dengan desain yang sepenuhnya responsif.',
                },
              ].map((feature, index) => (
                <div key={index} className="relative pt-4">
                  <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-transparent" />
                  <span className="text-primary0 text-sm font-semibold">
                    {feature.number}
                  </span>
                  <h3 className="mt-2 mb-3 text-2xl font-bold">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="container mx-auto px-4">
        <div className="mb-16">
          <h1 className="mb-8 text-2xl font-bold md:text-3xl lg:text-5xl">
            Kisah Sukses: Agen yang Mengubah Bisnis Mereka
          </h1>
          <p className="mb-12 max-w-4xl text-sm text-muted-foreground lg:text-lg">
            Dengarkan langsung dari sesama agen perjalanan yang telah mencapai
            pertumbuhan dan kesuksesan luar biasa dengan TravelBoost.
          </p>
        </div>

        <div className="flex gap-8">
          <div className="grid flex-1 grid-cols-2 gap-8">
            {[
              {
                name: 'Sarah: Pemesanan Berlipat Ganda',
                quote:
                  'TravelBoost membantu saya memamerkan paket mewah saya dengan mudah, menghasilkan peningkatan signifikan dalam pemesanan klien!',
              },
              {
                name: 'Global Travels: 40% Lebih Banyak Pertanyaan',
                quote:
                  'Pertanyaan klien kami melonjak setelah mengimplementasikan alat promosi TravelBoost yang canggih. Ini adalah terobosan baru!',
              },
              {
                name: 'Agen Top: Jangkauan Meluas',
                quote:
                  'Memanfaatkan integrasi media sosial TravelBoost telah memungkinkan kami menjangkau audiens baru dan mengembangkan bisnis kami secara eksponensial.',
                full: true,
              },
            ].map((testimonial, index) => (
              <Card
                key={index}
                className={`relative border-primary ${testimonial.full ? 'lg:col-span-2' : ''}`}
              >
                <span className="text-primary0 absolute -top-4 left-6 text-5xl font-bold">
                  "
                </span>
                <CardHeader>
                  <CardTitle className="text-xl">{testimonial.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{testimonial.quote}</p>
                  <span className="text-primary0 absolute right-6 -bottom-6 text-5xl font-bold">
                    "
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="w-100">
            <img
              src="https://travelboost.co.id/enam_xin.jpg"
              className="w-full rounded-4xl"
            />
          </div>
        </div>
      </section>

      {/* Marketing Support */}
      <section className="container mx-auto px-4 py-20">
        <h1 className="mb-16 text-2xl font-bold md:text-3xl lg:text-5xl">
          Dukungan Pemasaran yang Disesuaikan untuk Setiap Agen
        </h1>

        <div className="max-w-4xl space-y-12">
          {[
            {
              number: 1,
              title: 'Kampanye Menarik',
              description:
                'Akses panduan langkah demi langkah untuk membuat promosi yang menarik dan kampanye media sosial yang efektif.',
            },
            {
              number: 2,
              title: 'Keahlian Pasar Niche',
              description:
                'Dapatkan wawasan dan kiat eksklusif tentang pasar khusus seperti perjalanan kelompok, retret mewah, dan kapal pesiar.',
            },
            {
              number: 3,
              title: 'Audit yang Dipersonalisasi',
              description:
                'Terima audit pemasaran untuk mengoptimalkan kehadiran online Anda dan memaksimalkan potensi jangkauan Anda.',
            },
          ].map((feature, index) => (
            <div key={index} className="flex items-start gap-6">
              <div className="text-primary0 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary text-xl font-bold">
                {feature.number}
              </div>
              <div>
                <h3 className="mb-3 text-2xl font-bold">{feature.title}</h3>
                <p className="text-lg text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h1 className="mb-8 text-2xl font-bold md:text-3xl lg:text-5xl">
            Integrasi Mulus dengan Alat yang Ada
          </h1>
          <p className="mb-16 max-w-3xl text-lg text-muted-foreground">
            Hubungkan TravelBoost dengan mudah ke alur kerja Anda saat ini,
            menjadikan promosi dan manajemen sangat mudah.
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: '📄',
                title: 'Sinkronisasi Katalog Produk',
                description:
                  'Impor katalog produk Anda dengan mudah dari sistem pemesanan populer, menjaga semuanya tetap terbaru.',
              },
              {
                icon: '📣',
                title: 'Amplifikasi Media Sosial',
                description:
                  'Terhubung dengan Akun Kreator Facebook untuk meningkatkan merek pribadi Anda dan menjangkau audiens yang lebih luas.',
              },
              {
                icon: '⬆️',
                title: 'Opsi Ekspor Serbaguna',
                description:
                  'Hasilkan materi promosi untuk email, media sosial, dan cetak hanya dengan beberapa klik.',
              },
            ].map((integration) => (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-primary text-xl">
                    {integration.icon}
                  </div>
                  <div className="text-xl font-bold">{integration.title}</div>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {integration.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="container mx-auto px-4 py-20">
        <div className="container mx-auto px-4">
          <h1 className="mb-16 text-2xl font-bold md:text-3xl lg:text-5xl">
            Bergabunglah dengan Komunitas Profesional Perjalanan yang Berkembang
          </h1>

          <div className="flex gap-24">
            <div className="w-100">
              <img
                src="https://travelboost.co.id/tujuh.png"
                className="w-full"
              />
            </div>

            <div className="flex-1 space-y-12">
              {[
                {
                  number: '01',
                  title: 'Jaringan & Kolaborasi',
                  description:
                    'Terhubung dengan rekan-rekan, bagikan wawasan berharga, dan jelajahi peluang kolaborasi.',
                },
                {
                  number: '02',
                  title: 'Webinar Pakar',
                  description:
                    'Berpartisipasi dalam sesi Tanya Jawab langsung dan webinar dengan pakar industri terkemuka.',
                },
                {
                  number: '03',
                  title: 'Tetap Terkini',
                  description:
                    'Dapatkan tren perjalanan terbaru, wawasan pasar, dan peluang komisi secara langsung.',
                },
              ].map((feature, index) => (
                <div key={index} className="relative pt-4">
                  <div className="absolute top-0 right-0 left-0 h-0.5" />
                  <span className="text-sm font-semibold text-primary">
                    {feature.number}
                  </span>
                  <h3 className="mt-2 mb-3 text-2xl font-bold">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16">
            <h1 className="mb-8 text-2xl font-bold md:text-3xl lg:text-5xl">
              Siap Meningkatkan Bisnis Perjalanan Anda?
            </h1>
            <p className="max-w-3xl text-lg text-muted-foreground">
              Ambil langkah pertama menuju karier yang lebih sukses dan
              memuaskan sebagai agen perjalanan.
            </p>
          </div>

          <div className="flex gap-24">
            <div className="flex-1">
              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Mulai Uji Coba Gratis Anda
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Daftar hari ini dan mulailah mempromosikan produk
                      perjalanan Anda seperti seorang profesional berpengalaman.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Rangkul Masa Depan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Rasakan generasi berikutnya pemasaran agen perjalanan
                      dengan platform inovatif TravelPro.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-primary md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Klien Anda Menanti
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Mari bekerja sama untuk membuat setiap perjalanan tak
                      terlupakan. Petualangan Anda berikutnya dimulai sekarang!
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Link href="/register">
                <Button
                  size="lg"
                  className="rounded-full bg-primary px-8 py-6 text-lg font-semibold text-black hover:bg-orange-600"
                >
                  Gabung TravelBoost Sekarang <ChevronRight className="ml-2" />
                </Button>
              </Link>
            </div>

            <div className="w-72">
              <img
                src="https://travelboost.co.id/delapan.png"
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>
    </StdLayout>
  );
}
