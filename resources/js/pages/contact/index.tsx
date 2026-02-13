'use client';

import React from 'react';

import StdLayout from '@/components/layouts/std-layout';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      'Terima kasih atas pesan Anda! Tim kami akan menghubungi Anda segera.',
    );
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <StdLayout>
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-20 text-center">
          <h1 className="mb-6 text-5xl font-bold text-foreground md:text-6xl">
            Hubungi <span className="text-primary">Kami</span>
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-foreground/70">
            Ada pertanyaan? Kami siap membantu Anda menemukan solusi terbaik
            untuk bisnis perjalanan Anda.
          </p>
        </div>

        <div className="mb-20 grid gap-8 md:grid-cols-3">
          {[
            {
              title: 'Email',
              icon: '✉️',
              content: 'info@travelboost.co.id',
              link: 'mailto:info@travelboost.co.id',
            },
            {
              title: 'Telepon',
              icon: '📞',
              content: '+62 (0) 21 XXXX XXXX',
              link: 'tel:+622100000000',
            },
            {
              title: 'Alamat',
              icon: '📍',
              content: 'Jakarta, Indonesia',
              link: '#',
            },
          ].map((contact, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-card p-8 text-center transition hover:border-primary/50"
            >
              <div className="mb-4 text-5xl">{contact.icon}</div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">
                {contact.title}
              </h3>
              <a
                href={contact.link}
                className="text-primary transition hover:text-primary/80"
              >
                {contact.content}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-card p-12">
          <h2 className="mb-8 text-3xl font-bold text-foreground">
            Kirim Pesan Kami
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block font-medium text-foreground"
                >
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder-foreground/50 focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="Masukkan nama Anda"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block font-medium text-foreground"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder-foreground/50 focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="Masukkan email Anda"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block font-medium text-foreground"
              >
                Nomor Telepon
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder-foreground/50 focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Masukkan nomor telepon Anda"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="mb-2 block font-medium text-foreground"
              >
                Pesan
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder-foreground/50 focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Tuliskan pesan Anda di sini..."
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-primary hover:bg-primary/90"
            >
              Kirim Pesan
            </Button>
          </form>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-7xl border-t border-border px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="mb-12 text-center text-4xl font-bold text-foreground">
          Pertanyaan Umum
        </h2>
        <div className="mx-auto max-w-3xl space-y-6">
          {[
            {
              q: 'Berapa biaya untuk mendaftar di TravelBoost?',
              a: 'Biaya pendaftaran bervariasi tergantung pada paket yang Anda pilih. Hubungi tim kami untuk konsultasi gratis dan penawaran khusus.',
            },
            {
              q: 'Berapa lama proses setup akun saya?',
              a: 'Setup akun biasanya dapat diselesaikan dalam 24-48 jam. Tim support kami akan memandu Anda melalui setiap langkah proses.',
            },
            {
              q: 'Apakah ada kontrak jangka panjang yang diperlukan?',
              a: 'Kami menawarkan fleksibilitas dengan paket bulanan dan tahunan. Anda dapat memilih sesuai kebutuhan bisnis Anda.',
            },
            {
              q: 'Bagaimana dengan dukungan pelanggan?',
              a: 'Tim dukungan kami tersedia 24/7 melalui email, telepon, dan live chat untuk membantu pertanyaan atau masalah Anda.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-card p-6"
            >
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                {item.q}
              </h3>
              <p className="text-foreground/70">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </StdLayout>
  );
}
