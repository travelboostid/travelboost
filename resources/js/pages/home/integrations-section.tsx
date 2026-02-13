import { Download, FileText, Share2 } from 'lucide-react';

export function IntegrationsSection() {
  const integrations = [
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Sinkronisasi Katalog Produk',
      description:
        'Impor katalog produk Anda dengan mudah dari sistem pemesanan populer, menjaga semuanya tetap terbaru.',
    },
    {
      icon: <Share2 className="w-8 h-8" />,
      title: 'Amplifikasi Media Sosial',
      description:
        'Terhubung dengan Akun Kreator Facebook untuk meningkatkan merek pribadi Anda dan menjangkau audiens yang lebih luas.',
    },
    {
      icon: <Download className="w-8 h-8" />,
      title: 'Opsi Ekspor Serbaguna',
      description:
        'Hasilkan materi promosi untuk email, media sosial, dan cetak hanya dengan beberapa klik.',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance font-georgia">
            Integrasi Mulus dengan Alat yang Ada
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Hubungkan TravelBoost dengan mudah ke alur kerja Anda saat ini,
            menjadikan promosi dan manajemen sangat mudah.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {integrations.map((integration) => (
            <div
              key={integration.title}
              className="text-center p-8 bg-card rounded-2xl border border-border hover:shadow-lg transition-shadow"
            >
              <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center text-accent-foreground mx-auto mb-6">
                {integration.icon}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 font-playfair-display">
                {integration.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {integration.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
