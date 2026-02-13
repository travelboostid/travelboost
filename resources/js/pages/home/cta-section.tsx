import { Button } from '@/components/ui/button';
import { Heart, Rocket, Sparkles } from 'lucide-react';

export function CTASection() {
  const cards = [
    {
      icon: <Rocket className="w-8 h-8" />,
      title: 'Mulai Uji Coba Gratis Anda',
      description:
        'Daftar hari ini dan mulailah mempromosikan produk perjalanan Anda seperti seorang profesional berpengalaman.',
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Rangkul Masa Depan',
      description:
        'Rasakan generasi berikutnya pemasaran agen perjalanan dengan platform inovatif TravelBoost.',
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Klien Anda Menanti',
      description:
        'Mari bekerja sama untuk membuat setiap perjalanan tak terlupakan. Petualangan Anda berikutnya dimulai sekarang!',
    },
  ];

  return (
    <section id="contact" className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-georgia font-bold text-foreground text-balance">
            Siap Meningkatkan Bisnis Perjalanan Anda?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Ambil langkah pertama menuju karier yang lebih sukses dan memuaskan
            sebagai agen perjalanan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {cards.map((card) => (
            <div
              key={card.title}
              className="text-center p-8 bg-card rounded-2xl border border-border"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                {card.icon}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3 font-playfair-display">
                {card.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" className="text-lg px-10 py-6">
            Gabung TravelBoost Sekarang
          </Button>
        </div>
      </div>
    </section>
  );
}
