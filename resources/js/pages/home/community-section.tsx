import { TrendingUp, Users, Video } from 'lucide-react';

export function CommunitySection() {
  const features = [
    {
      number: '01',
      icon: <Users className="w-5 h-5" />,
      title: 'Jaringan & Kolaborasi',
      description:
        'Terhubung dengan rekan-rekan, bagikan wawasan berharga, dan jelajahi peluang kolaborasi.',
    },
    {
      number: '02',
      icon: <Video className="w-5 h-5" />,
      title: 'Webinar Pakar',
      description:
        'Berpartisipasi dalam sesi Tanya Jawab langsung dan webinar dengan pakar industri terkemuka.',
    },
    {
      number: '03',
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Tetap Terkini',
      description:
        'Dapatkan tren perjalanan terbaru, wawasan pasar, dan peluang komisi secara langsung.',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-georgia font-bold text-foreground">
            Bergabunglah dengan Komunitas Profesional Perjalanan yang Berkembang
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* IMAGE */}
          <div className="relative">
            <div className="aspect-4/3 rounded-2xl overflow-hidden shadow-xl">
              <img
                src="/images/travel-community.jpg"
                alt="Travel Professionals Community"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* FEATURES */}
          <div className="space-y-6">
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
