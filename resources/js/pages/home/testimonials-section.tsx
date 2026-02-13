import { Quote } from 'lucide-react';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Sarah',
      role: 'Travel Agent',
      quote:
        'TravelBoost membantu saya memamerkan paket mewah saya dengan mudah, menghasilkan peningkatan signifikan dalam pemesanan klien!',
      highlight: 'Pemesanan Berlipat Ganda',
    },
    {
      name: 'Global Travels',
      role: 'Travel Agency',
      quote:
        'Pertanyaan klien kami melonjak setelah mengimplementasikan alat promosi TravelBoost yang canggih. Ini adalah terobosan baru!',
      highlight: '40% Lebih Banyak Pertanyaan',
    },
    {
      name: 'Agen Top',
      role: 'Premium Agent',
      quote:
        'Memanfaatkan integrasi media sosial TravelBoost telah memungkinkan kami menjangkau audiens baru dan mengembangkan bisnis kami secara eksponensial.',
      highlight: 'Jangkauan Meluas',
    },
  ];

  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance font-georgia">
            Kisah Sukses: Agen yang Mengubah Bisnis Mereka
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Dengarkan langsung dari sesama agen perjalanan yang telah mencapai
            pertumbuhan dan kesuksesan luar biasa dengan TravelBoost.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="relative bg-card rounded-2xl p-8 border border-border shadow-sm"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10" />
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                  {testimonial.highlight}
                </span>
              </div>
              <p className="text-foreground mb-6 leading-relaxed italic">
                {'"'}
                {testimonial.quote}
                {'"'}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
