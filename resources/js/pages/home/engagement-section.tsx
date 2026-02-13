import { Bell, MessageSquare, Smartphone } from 'lucide-react';

export function EngagementSection() {
  const features = [
    {
      number: '01',
      icon: <MessageSquare className="w-5 h-5" />,
      title: 'Pertanyaan yang Efisien',
      description:
        'Formulir terintegrasi memudahkan klien untuk bertanya dan meminta pemesanan.',
    },
    {
      number: '02',
      icon: <Bell className="w-5 h-5" />,
      title: 'Notifikasi Otomatis',
      description:
        'Tetap terinformasi dengan peringatan real-time, memastikan Anda dan klien Anda selalu sinkron.',
    },
    {
      number: '03',
      icon: <Smartphone className="w-5 h-5" />,
      title: 'Pengalaman yang Dioptimalkan untuk Seluler',
      description:
        'Akses TravelBoost kapan saja, di mana saja, dengan desain yang sepenuhnya responsif.',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground font-georgia">
            Sederhanakan Keterlibatan & Pemesanan Klien
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* IMAGE */}
          <div className="relative order-2 lg:order-1">
            <div className="aspect-3/4 max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="/images/mobile-app.jpg"
                alt="TravelBoost Mobile App"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* FEATURES */}
          <div className="order-1 lg:order-2 space-y-6">
            {features.map((feature) => (
              <div
                key={feature.number}
                className="flex gap-4 p-5 bg-card rounded-xl border border-border"
              >
                <div className="shrink-0 flex items-start">
                  <span className="text-3xl font-bold text-primary/30">
                    {feature.number}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      {feature.icon}
                    </div>

                    <h3 className="font-semibold text-foreground font-playfair-display">
                      {feature.title}
                    </h3>
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
