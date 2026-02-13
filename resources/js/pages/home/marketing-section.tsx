import { FileSearch, Megaphone, Target } from 'lucide-react';

export function MarketingSection() {
  const features = [
    {
      number: '1',
      icon: <Megaphone className="w-6 h-6" />,
      title: 'Kampanye Menarik',
      description:
        'Akses panduan langkah demi langkah untuk membuat promosi yang menarik dan kampanye media sosial yang efektif.',
    },
    {
      number: '2',
      icon: <Target className="w-6 h-6" />,
      title: 'Keahlian Pasar Niche',
      description:
        'Dapatkan wawasan dan kiat eksklusif tentang pasar khusus seperti perjalanan kelompok, retret mewah, dan kapal pesiar.',
    },
    {
      number: '3',
      icon: <FileSearch className="w-6 h-6" />,
      title: 'Audit yang Dipersonalisasi',
      description:
        'Terima audit pemasaran untuk mengoptimalkan kehadiran online Anda dan memaksimalkan potensi jangkauan Anda.',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance font-georgia">
            Dukungan Pemasaran yang Disesuaikan untuk Setiap Agen
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.number}
              className="relative bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-8 border border-primary-foreground/20"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                  {feature.icon}
                </div>
                <span className="text-4xl font-bold text-primary-foreground/30">
                  {feature.number}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-3 font-playfair-display">
                {feature.title}
              </h3>
              <p className="text-primary-foreground/80 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
