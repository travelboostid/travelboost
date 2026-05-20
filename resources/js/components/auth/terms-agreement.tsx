import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type TermsLanguage = 'en' | 'id';

type TermsItem = {
  label?: string;
  text: string;
};

type TermsSection = {
  title: string;
  lead?: string;
  items?: TermsItem[];
};

type TermsCopy = {
  title: string;
  platform?: string;
  intro: string;
  sections: TermsSection[];
};

type TermsAgreementProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  variant: 'affiliate' | 'agent';
  tabIndex?: number;
  error?: string;
};

const terms: Record<'affiliate' | 'agent', Record<TermsLanguage, TermsCopy>> = {
  affiliate: {
    en: {
      title:
        'Terms and Conditions for TravelBoost Affiliate Marketing Partnership',
      intro:
        'Welcome to the TravelBoost platform. These Terms and Conditions are a legal agreement between PT. Erasoft Teknologi Indonesia, as the platform provider, together with the related Master Affiliate, and you as an Affiliate. By registering and using your Affiliate account, you declare that you are bound by and agree to all provisions below.',
      sections: [
        {
          title: '1. Operational Definitions',
          items: [
            {
              label: 'Company',
              text: 'PT. Erasoft Teknologi Indonesia as the owner and manager of the TravelBoost application.',
            },
            {
              label: 'Master Affiliate',
              text: 'The Company strategic partner that holds the main distribution rights and is responsible for managing the Affiliate network under them.',
            },
            {
              label: 'Affiliate',
              text: 'An individual or business entity that cooperates to distribute TravelBoost application services specifically to Travel Agents.',
            },
            {
              label: 'Travel Agent',
              text: 'The end user of the platform who subscribes to the TravelBoost application to directly sell tour packages to consumers.',
            },
          ],
        },
        {
          title: '2. Scope of Accreditation and Marketing',
          items: [
            {
              label: 'Marketing Rights',
              text: 'Affiliates are given the right to market TravelBoost application licenses to prospective Travel Agents.',
            },
            {
              label: 'Structural Relationship',
              text: 'In carrying out operations, Affiliates are under the coordination, guidance, and supervision of the Master Affiliate that oversees them.',
            },
          ],
        },
        {
          title: '3. Affiliate Commission Scheme (Financial)',
          items: [
            {
              label: 'Commission Amount',
              text: 'Affiliates are entitled to receive a Direct Commission of 15% from the application subscription price paid by Travel Agents under their network.',
            },
            {
              label: 'Calculation Basis (Price)',
              text: 'Commission is calculated from the Travel Agent subscription fee of Rp 500,000 per month or Rp 6,000,000 per year, after deducting 11% VAT and any official promotional or discount deductions.',
            },
            {
              text: 'Prices may be changed at any time by the Company (PT. Erasoft Teknologi Indonesia).',
            },
            {
              label: 'Recurring Commission',
              text: 'Affiliates remain entitled to receive a 15% commission in the second year and subsequent years, as long as the related Travel Agent actively extends their subscription period in the TravelBoost application.',
            },
            {
              label: 'Withdrawal',
              text: 'Commission withdrawal is carried out through the available system, and the Company is required to disburse the funds no later than 3 (three) working days after the withdrawal request is submitted.',
            },
          ],
        },
        {
          title: '4. Affiliate Rights and Obligations',
          items: [
            {
              label: 'Travel Agent Acquisition',
              text: 'Affiliates are obliged to actively find, recruit, and direct Travel Agents to subscribe and transact within the TravelBoost application.',
            },
            {
              label: 'Price Compliance',
              text: 'Affiliates are strictly prohibited from increasing, reducing, or manipulating subscription prices outside the official prices stated in the TravelBoost application.',
            },
            {
              label: 'Brand Integrity',
              text: 'Affiliates are required to maintain the reputation, goodwill, and commercial image of the TravelBoost.co.id brand in every marketing activity.',
            },
          ],
        },
        {
          title: '5. Transaction System and Account Security',
          items: [
            {
              label: 'Payment Gateway',
              text: 'All financial transactions, deposits, and commission operations must use the Wallet system integrated in the application.',
            },
            {
              label: 'Account Confidentiality',
              text: 'Affiliates are fully and personally responsible for the security of their password and account access. The Company is not responsible for losses in any form caused by negligence in maintaining account confidentiality.',
            },
          ],
        },
        {
          title: '6. Data Protection and Privacy',
          items: [
            {
              label: 'Confidentiality',
              text: 'Affiliates are prohibited from distributing, misusing, or leaking user data (Travel Agents/consumers) or internal company data to third parties without written permission.',
            },
            {
              label: 'Legal Sanctions',
              text: 'Violation of this data confidentiality will result in unilateral partnership termination, account deletion, and criminal/civil legal claims referring to the applicable ITE Law.',
            },
          ],
        },
        {
          title: '7. Term and Dispute Resolution',
          items: [
            {
              label: 'Validity Period',
              text: 'These partnership provisions bind Affiliates as long as the Company and the Affiliate still agree to cooperate.',
            },
            {
              label: 'Extension',
              text: 'The partnership may be extended automatically unless there is a termination request or an ethical code violation by the Affiliate.',
            },
            {
              label: 'Jurisdiction',
              text: 'If a dispute occurs that cannot be resolved through deliberation, the legal settlement will be fully submitted to the District Court in the legal domicile of the Company (PT. Erasoft Teknologi Indonesia).',
            },
          ],
        },
      ],
    },
    id: {
      title:
        'Terms and Conditions (Syarat dan Ketentuan) Kemitraan Pemasaran - Afiliator TravelBoost',
      intro:
        'Selamat datang di platform TravelBoost. Syarat dan Ketentuan ini merupakan kesepakatan hukum antara PT. Erasoft Teknologi Indonesia (selaku penyedia platform) bersama dengan Master Afiliator terkait, dengan Anda selaku Afiliator. Dengan mendaftar dan menggunakan akun Afiliator Anda, Anda menyatakan tunduk dan menyetujui seluruh ketentuan di bawah ini.',
      sections: [
        {
          title: '1. Definisi Operasional',
          items: [
            {
              label: 'Perusahaan',
              text: 'PT. Erasoft Teknologi Indonesia selaku pemilik dan pengelola aplikasi TravelBoost.',
            },
            {
              label: 'Master Afiliator',
              text: 'Mitra strategis Perusahaan yang memegang hak distribusi utama dan bertanggung jawab atas manajemen jaringan Afiliator di bawahnya.',
            },
            {
              label: 'Afiliator',
              text: 'Perorangan atau badan usaha yang bekerja sama untuk mendistribusikan layanan aplikasi TravelBoost secara khusus kepada Travel Agen.',
            },
            {
              label: 'Travel Agen',
              text: 'Pengguna akhir (end-user) platform yang berlangganan aplikasi TravelBoost untuk melakukan penjualan langsung paket wisata kepada konsumen.',
            },
          ],
        },
        {
          title: '2. Ruang Lingkup Akreditasi & Pemasaran',
          items: [
            {
              label: 'Hak Pemasaran',
              text: 'Afiliator diberikan hak untuk memasarkan lisensi aplikasi TravelBoost kepada calon Travel Agen.',
            },
            {
              label: 'Hubungan Struktural',
              text: 'Dalam menjalankan operasionalnya, Afiliator berada di bawah koordinasi, pembinaan, dan pengawasan Master Afiliator yang menaunginya.',
            },
          ],
        },
        {
          title: '3. Skema Komisi Afiliator (Finansial)',
          items: [
            {
              label: 'Besaran Komisi',
              text: 'Afiliator berhak mendapatkan Direct Commission sebesar 15% dari Harga Langganan aplikasi yang dibayarkan oleh Travel Agen di bawah jaringannya.',
            },
            {
              label: 'Dasar Perhitungan (Harga)',
              text: 'Komisi dihitung dari biaya langganan Travel Agen sebesar Rp 500.000,-/bulan atau Rp 6.000.000,-/tahun, setelah dikurangi PPN 11% serta potongan promo atau diskon resmi jika ada.',
            },
            {
              text: 'Harga sewaktu-waktu dapat diubah oleh Perusahaan (PT. Erasoft Teknologi Indonesia).',
            },
            {
              label: 'Komisi Berkelanjutan (Recurring)',
              text: 'Afiliator tetap berhak menerima komisi sebesar 15% pada tahun kedua dan tahun-tahun berikutnya, sepanjang Travel Agen yang bersangkutan aktif memperpanjang masa langganannya di aplikasi TravelBoost.',
            },
            {
              label: 'Pencairan Dana (Withdrawal)',
              text: 'Penarikan komisi dilakukan melalui sistem yang tersedia, dan Perusahaan wajib mencairkan dana tersebut selambat-lambatnya 3 (tiga) hari kerja setelah pengajuan penarikan (withdrawal) dikirimkan.',
            },
          ],
        },
        {
          title: '4. Hak dan Kewajiban Afiliator',
          items: [
            {
              label: 'Akuisisi Travel Agen',
              text: 'Afiliator berkewajiban aktif mencari, merekrut, dan mengarahkan Travel Agen untuk berlangganan dan bertransaksi di dalam aplikasi TravelBoost.',
            },
            {
              label: 'Kepatuhan Harga',
              text: 'Afiliator dilarang keras menaikkan, menurunkan, atau memanipulasi harga langganan di luar harga resmi yang tertera pada aplikasi TravelBoost.',
            },
            {
              label: 'Integritas Brand',
              text: 'Afiliator wajib menjaga reputasi, nama baik, dan citra komersial dari brand TravelBoost.co.id dalam setiap aktivitas pemasaran.',
            },
          ],
        },
        {
          title: '5. Sistem Transaksi dan Keamanan Akun',
          items: [
            {
              label: 'Gerbang Pembayaran',
              text: 'Segala transaksi keuangan, deposit, dan operasional komisi wajib menggunakan sistem Wallet yang terintegrasi di aplikasi.',
            },
            {
              label: 'Kerahasiaan Akun',
              text: 'Afiliator bertanggung jawab penuh secara pribadi atas keamanan password dan akses akun miliknya. Perusahaan tidak bertanggung jawab atas kerugian dalam bentuk apa pun akibat kelalaian penjagaan kerahasiaan akun.',
            },
          ],
        },
        {
          title: '6. Perlindungan Data & Privasi',
          items: [
            {
              label: 'Kerahasiaan',
              text: 'Afiliator dilarang menyebarkan, menyalahgunakan, atau membocorkan data pengguna (Travel Agen/konsumen) maupun data internal perusahaan kepada pihak ketiga tanpa izin tertulis.',
            },
            {
              label: 'Sanksi Hukum',
              text: 'Pelanggaran terhadap kerahasiaan data ini akan berakibat pada pemutusan hubungan kemitraan secara sepihak, penghapusan akun, serta tuntutan hukum pidana/perdata mengacu pada UU ITE yang berlaku.',
            },
          ],
        },
        {
          title: '7. Jangka Waktu & Penyelesaian Sengketa',
          items: [
            {
              label: 'Masa Berlaku',
              text: 'Ketentuan kemitraan ini mengikat Afiliator selama pihak perusahaan dan pihak Afiliator masih sepakat bekerja sama.',
            },
            {
              label: 'Perpanjangan',
              text: 'Kemitraan dapat diperpanjang secara otomatis kecuali ada permintaan penghentian atau terdapat pelanggaran kode etik dari pihak Afiliator.',
            },
            {
              label: 'Yurisdiksi',
              text: 'Jika terjadi perselisihan yang tidak dapat diselesaikan secara musyawarah, maka penyelesaian hukum akan diserahkan sepenuhnya kepada Pengadilan Negeri di wilayah domisili hukum Perusahaan (PT. Erasoft Teknologi Indonesia).',
            },
          ],
        },
      ],
    },
  },
  agent: {
    en: {
      title: 'Terms and Conditions for Agent Registration in TravelBoost',
      platform: 'Platform: travelboost.co.id',
      intro:
        'Welcome to TravelBoost. By registering as a Travel Agent on our platform, you, hereinafter referred to as the Partner, declare that you have read, understood, and agreed to all contents of these Terms and Conditions.',
      sections: [
        {
          title: '1. Registration Requirements',
          items: [
            {
              label: 'Legality',
              text: 'Partners must have valid legal identity, either an ID card for individuals or company legal documents for business entities.',
            },
            {
              label: 'Data Accuracy',
              text: 'Partners must provide accurate, complete, and up-to-date data. TravelBoost has the right to verify and reject registration without providing a reason.',
            },
            {
              label: 'Account',
              text: 'Partners are fully responsible for password confidentiality and activities that occur under the dev.travelboost.co.id account.',
            },
          ],
        },
        {
          title: '2. Employment Relationship Status',
          lead: "The relationship between TravelBoost and the Partner is an independent business partner relationship. These Terms and Conditions do not create an employment relationship (employer-employee), joint venture, or exclusive agency relationship that legally binds TravelBoost for the Partner's personal actions.",
        },
        {
          title: '3. Service Scope & Partner Obligations',
          items: [
            {
              label: 'Information Presentation',
              text: 'Partners must provide accurate travel package information to prospective customers, according to the data available in the TravelBoost system.',
            },
            {
              label: 'Service Quality',
              text: "Partners commit to maintaining TravelBoost's good name by providing professional and ethical service.",
            },
            {
              label: 'Prohibition',
              text: 'Partners are strictly prohibited from manipulating prices outside the specified limits or misusing the TravelBoost trademark for activities that violate the law.',
            },
          ],
        },
        {
          title: '4. Commission and Payment System',
          items: [
            {
              label: 'Commission Scheme',
              text: 'The amount of commission or profit sharing will be determined based on the applicable policy from the Vendor providing the Tour Package.',
            },
            {
              label: 'Withdrawal',
              text: 'Balance or commission withdrawals are carried out according to the schedule and minimum limits set in the system.',
            },
            {
              label: 'Tax',
              text: "All tax obligations arising from Partner income are the Partner's responsibility in accordance with tax regulations in Indonesia.",
            },
          ],
        },
        {
          title: '5. Cancellation and Refund Policy',
          items: [
            {
              text: 'Every transaction cancellation by customers will follow the cancellation policy from the vendor providing the Tour Package.',
            },
            {
              text: 'Partners must inform customers of the cancellation policy before the transaction is made.',
            },
          ],
        },
        {
          title: '6. Security and Data Protection',
          items: [
            {
              text: 'TravelBoost will protect Partner personal data in accordance with our privacy policy.',
            },
            {
              text: 'Partners are prohibited from leaking customer data obtained through the TravelBoost platform to third parties without written permission.',
            },
          ],
        },
        {
          title: '7. Partnership Termination',
          lead: 'TravelBoost has the right to unilaterally deactivate Partner accounts if the following are found:',
          items: [
            {
              text: 'Violation of these Terms and Conditions.',
            },
            {
              text: 'Fraudulent action or system abuse.',
            },
            {
              text: "Activities that harm TravelBoost's reputation.",
            },
          ],
        },
        {
          title: '8. Changes to Terms',
          lead: 'TravelBoost may change these Terms and Conditions at any time. Changes will be informed through notifications in the application or email. Continued use of the platform after changes is deemed as approval of the new terms.',
        },
        {
          title: '9. Governing Law',
          lead: 'These Terms and Conditions are governed and interpreted in accordance with the laws of the Republic of Indonesia. Any disputes that arise will be resolved through deliberation for consensus, or through legal channels in the agreed legal jurisdiction.',
        },
      ],
    },
    id: {
      title: 'Syarat dan Ketentuan Pendaftaran Agen di Aplikasi TravelBoost',
      platform: 'Platform: travelboost.co.id',
      intro:
        'Selamat datang di TravelBoost. Dengan mendaftar sebagai Agen Perjalanan di platform kami, Anda (selanjutnya disebut sebagai "Mitra") menyatakan bahwa Anda telah membaca, memahami, dan menyetujui seluruh isi dalam Syarat dan Ketentuan ini.',
      sections: [
        {
          title: '1. Persyaratan Pendaftaran',
          items: [
            {
              label: 'Legalitas',
              text: 'Mitra wajib memiliki identitas hukum yang sah (KTP untuk perorangan atau dokumen legalitas perusahaan untuk badan usaha).',
            },
            {
              label: 'Kebenaran Data',
              text: 'Mitra wajib memberikan data yang akurat, lengkap, dan terbaru. TravelBoost berhak melakukan verifikasi dan menolak pendaftaran tanpa memberikan alasan.',
            },
            {
              label: 'Akun',
              text: 'Mitra bertanggung jawab penuh atas kerahasiaan kata sandi dan aktivitas yang terjadi di bawah akun dev.travelboost.co.id.',
            },
          ],
        },
        {
          title: '2. Status Hubungan Kerja',
          lead: 'Hubungan antara TravelBoost dan Mitra adalah sebagai mitra bisnis independen. Syarat dan Ketentuan ini tidak menciptakan hubungan kerja (majikan-karyawan), kemitraan bersama (joint venture), atau hubungan keagenan eksklusif yang mengikat TravelBoost secara hukum atas tindakan pribadi Mitra.',
        },
        {
          title: '3. Lingkup Layanan & Kewajiban Mitra',
          items: [
            {
              label: 'Penyajian Informasi',
              text: 'Mitra wajib memberikan informasi paket perjalanan yang akurat kepada calon pelanggan, sesuai dengan data yang tersedia di sistem TravelBoost.',
            },
            {
              label: 'Kualitas Layanan',
              text: 'Mitra berkomitmen untuk menjaga nama baik TravelBoost dengan memberikan pelayanan yang profesional dan etis.',
            },
            {
              label: 'Larangan',
              text: 'Mitra dilarang keras melakukan manipulasi harga di luar batas yang ditentukan atau menyalahgunakan merek dagang TravelBoost untuk kegiatan yang melanggar hukum.',
            },
          ],
        },
        {
          title: '4. Sistem Komisi dan Pembayaran',
          items: [
            {
              label: 'Skema Komisi',
              text: 'Besaran komisi atau bagi hasil akan ditentukan berdasarkan kebijakan yang berlaku dari Vendor penyedia Paket Wisata.',
            },
            {
              label: 'Pencairan Dana',
              text: 'Penarikan saldo atau komisi dilakukan sesuai dengan jadwal dan batas minimum yang ditetapkan dalam sistem.',
            },
            {
              label: 'Pajak',
              text: 'Seluruh kewajiban pajak yang timbul dari pendapatan Mitra merupakan tanggung jawab Mitra sesuai dengan peraturan perpajakan di Indonesia.',
            },
          ],
        },
        {
          title: '5. Kebijakan Pembatalan dan Pengembalian (Refund)',
          items: [
            {
              text: 'Setiap pembatalan transaksi oleh pelanggan akan mengikuti kebijakan pembatalan dari vendor penyedia Paket Wisata.',
            },
            {
              text: 'Mitra wajib menginformasikan kebijakan pembatalan kepada pelanggan sebelum transaksi dilakukan.',
            },
          ],
        },
        {
          title: '6. Keamanan dan Perlindungan Data',
          items: [
            {
              text: 'TravelBoost akan melindungi data pribadi Mitra sesuai dengan kebijakan privasi kami.',
            },
            {
              text: 'Mitra dilarang membocorkan data pelanggan yang diperoleh melalui platform TravelBoost kepada pihak ketiga tanpa izin tertulis.',
            },
          ],
        },
        {
          title: '7. Pemutusan Kemitraan',
          lead: 'TravelBoost berhak menonaktifkan akun Mitra secara sepihak jika ditemukan:',
          items: [
            {
              text: 'Pelanggaran terhadap Syarat dan Ketentuan ini.',
            },
            {
              text: 'Tindakan penipuan atau penyalahgunaan sistem.',
            },
            {
              text: 'Aktivitas yang merugikan reputasi TravelBoost.',
            },
          ],
        },
        {
          title: '8. Perubahan Ketentuan',
          lead: 'TravelBoost dapat mengubah Syarat dan Ketentuan ini sewaktu-waktu. Perubahan akan diinformasikan melalui notifikasi di aplikasi atau email. Penggunaan platform secara berkelanjutan setelah perubahan dianggap sebagai persetujuan terhadap ketentuan baru.',
        },
        {
          title: '9. Hukum yang Berlaku',
          lead: 'Syarat dan Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum Negara Republik Indonesia. Segala perselisihan yang timbul akan diselesaikan melalui musyawarah untuk mufakat, atau melalui jalur hukum di wilayah hukum yang disepakati.',
        },
      ],
    },
  },
};

export function TermsAgreement({
  checked,
  onCheckedChange,
  variant,
  tabIndex,
  error,
}: TermsAgreementProps) {
  const [language, setLanguage] = useState<TermsLanguage>('en');
  const copy = terms[variant][language];

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border bg-card p-4 text-sm shadow-sm',
          error ? 'border-destructive/60' : 'border-border',
        )}
      >
        <Checkbox
          id={`${variant}-terms`}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          tabIndex={tabIndex}
          className="mt-0.5"
        />
        <div className="text-sm leading-relaxed text-muted-foreground">
          <label htmlFor={`${variant}-terms`}>
            I have read and agree to the{' '}
          </label>
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Terms and Conditions
              </button>
            </DialogTrigger>
            <DialogContent
              className="max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[56rem] overflow-hidden rounded-2xl p-0 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)]"
              aria-describedby={undefined}
            >
              <DialogHeader className="border-b bg-muted/20 px-5 py-5 text-left sm:px-7">
                <div className="flex flex-col gap-4 pr-8 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      TravelBoost Agreement
                    </p>
                    <DialogTitle className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                      {copy.title}
                    </DialogTitle>
                    {copy.platform && (
                      <p className="text-sm font-medium text-muted-foreground">
                        {copy.platform}
                      </p>
                    )}
                  </div>
                  <div className="inline-flex w-fit rounded-full border bg-background p-1 shadow-sm">
                    {(['en', 'id'] as TermsLanguage[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={cn(
                          'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                          language === option
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                        onClick={() => setLanguage(option)}
                      >
                        {option.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </DialogHeader>
              <div className="max-h-[calc(100dvh-13rem)] overflow-y-auto px-5 py-5 sm:max-h-[calc(100dvh-15rem)] sm:px-7">
                <div className="space-y-5 font-sans text-sm leading-7 text-foreground">
                  <div className="rounded-xl border bg-background p-4 text-muted-foreground shadow-sm">
                    {copy.intro}
                  </div>
                  <div className="grid gap-4">
                    {copy.sections.map((section) => (
                      <section
                        key={section.title}
                        className="rounded-xl border bg-background p-4 shadow-sm"
                      >
                        <h3 className="text-base font-semibold leading-6 text-foreground">
                          {section.title}
                        </h3>
                        {section.lead && (
                          <p className="mt-3 text-muted-foreground">
                            {section.lead}
                          </p>
                        )}
                        {section.items && (
                          <ul className="mt-3 space-y-3">
                            {section.items.map((item, index) => (
                              <li
                                key={`${section.title}-${index}`}
                                className="flex gap-3"
                              >
                                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                                <span className="min-w-0 text-muted-foreground">
                                  {item.label && (
                                    <span className="font-semibold text-foreground">
                                      {item.label}:{' '}
                                    </span>
                                  )}
                                  {item.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <span>.</span>
        </div>
      </div>
      {error && (
        <p className="text-[0.8rem] font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
