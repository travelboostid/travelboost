import { Compass, ImageIcon, Layout } from 'lucide-react';

export function VisualsSection() {
  const features = [
    {
      icon: <ImageIcon className="w-6 h-6" />,
      title: 'Media Berkualitas Tinggi',
      description:
        'Unggah foto yang jernih dan video yang imersif untuk menghidupkan destinasi Anda.',
    },
    {
      icon: <Layout className="w-6 h-6" />,
      title: 'Template Siap Pakai',
      description:
        'Manfaatkan template yang dirancang secara profesional, terintegrasi dengan Canva, untuk promosi yang mudah dan berdampak.',
    },
    {
      icon: <Compass className="w-6 h-6" />,
      title: 'Sorot Pengalaman Unik',
      description:
        'Pamerkan segalanya mulai dari kapal pesiar mewah hingga tur petualangan mendebarkan dan liburan budaya yang memperkaya.',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance font-georgia">
            Visual Menawan yang Menjual Impian
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Pikat calon klien dengan gambar yang memukau dan video yang menarik,
            menjadikan aspirasi perjalanan mereka kenyataan yang hidup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-card rounded-2xl p-8 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 bg-accent/20 rounded-xl flex items-center justify-center text-accent-foreground mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 font-playfair-display">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
