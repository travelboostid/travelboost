export function StepsSection() {
  const steps = [
    {
      number: '1',
      title: 'Pamerkan Tur Eksklusif',
      description:
        'Tampilkan tur unik Anda, paket khusus, dan penawaran tak terkalahkan dengan mudah kepada audiens luas para pelancong yang antusias.',
    },
    {
      number: '2',
      title: 'Terhubung dengan Pelancong',
      description:
        'Berinteraksi langsung dengan klien yang secara aktif mencari saran ahli dan perencanaan perjalanan yang dipersonalisasi, membangun hubungan jangka panjang.',
    },
    {
      number: '3',
      title: 'Tingkatkan Visibilitas Merek',
      description:
        'Tingkatkan merek Anda dengan alat promosi profesional yang dapat disesuaikan, dirancang untuk membuat agensi Anda menonjol.',
    },
  ];

  return (
    <section id="features" className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance font-georgia">
            Berdayakan Bisnis Perjalanan Anda Tidak Seperti Sebelumnya
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="absolute -top-4 left-8 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">
                  {step.number}
                </span>
              </div>
              <div className="pt-6">
                <h3 className="text-xl font-semibold text-foreground mb-3 font-playfair-display">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
