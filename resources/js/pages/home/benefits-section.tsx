import { BarChart3, LayoutDashboard, RefreshCw } from 'lucide-react';

export function BenefitsSection() {
  const benefits = [
    {
      icon: <LayoutDashboard className="w-6 h-6" />,
      title: 'Platform Terpusat',
      description:
        'Kelola dan promosikan semua produk perjalanan Anda yang beragam dari satu dasbor yang intuitif.',
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: 'Real-time & Dapat Disesuaikan',
      description:
        'Perbarui konten secara instan tanpa perlu pengetahuan coding, memastikan penawaran Anda selalu terkini.',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analitik Berwawasan',
      description:
        'Lacak keterlibatan klien dan pantau kinerja penawaran untuk menyempurnakan strategi Anda dan memaksimalkan konversi.',
    },
  ];

  return (
    <section id="benefits" className="py-20 lg:py-28 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* TEXT */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 font-georgia">
              Mengapa TravelBoost? Keunggulan Agen
            </h2>

            <div className="space-y-6">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex gap-4 p-4 bg-card rounded-xl border border-border"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    {benefit.icon}
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-1 font-playfair-display">
                      {benefit.title}
                    </h3>

                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IMAGE */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <img
                src="/images/travel-dashboard.jpg"
                alt="TravelBoost Dashboard"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
