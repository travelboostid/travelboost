import type { LucideIcon } from 'lucide-react';
import {
    BarChart3,
    BookOpen,
    Layout,
    MessageSquare,
    Plane,
    Rocket,
    Users,
    Wallet,
} from 'lucide-react';

export type DocAudience = 'vendor' | 'agent' | 'customer' | 'all';

export type DocCapability = {
    title: string;
    description: string;
};

export type DocFeature = {
    id: string;
    title: string;
    summary: string;
    icon: LucideIcon;
    audiences: DocAudience[];
    capabilities: DocCapability[];
};

export const docFeatures: DocFeature[] = [
    {
        id: 'getting-started',
        title: 'Memulai',
        summary:
            'Langkah awal untuk vendor, agen, dan tim yang baru bergabung di TravelBoost.',
        icon: Rocket,
        audiences: ['all'],
        capabilities: [
            {
                title: 'Daftar dan verifikasi akun',
                description:
                    'Buat akun perusahaan, lengkapi profil, dan verifikasi email agar tim dapat mengakses dashboard.',
            },
            {
                title: 'Pilih peran bisnis',
                description:
                    'Vendor mengelola katalog paket sendiri. Agen menjual paket vendor dan paket kurasi sendiri melalui landing page.',
            },
            {
                title: 'Atur parameter operasional',
                description:
                    'Konfigurasi batas waktu booking, kebijakan pembayaran, dan preferensi bisnis dari menu Settings → Parameters.',
            },
            {
                title: 'Undang anggota tim',
                description:
                    'Tambahkan staf dengan peran dan izin berbeda agar pekerjaan operasional dapat dibagi dengan aman.',
            },
        ],
    },
    {
        id: 'tours',
        title: 'Produk & Katalog',
        summary:
            'Kelola paket tour, jadwal keberangkatan, harga, dan kategori produk.',
        icon: Plane,
        audiences: ['vendor', 'agent'],
        capabilities: [
            {
                title: 'Buat dan edit paket tour',
                description:
                    'Tambahkan destinasi, itinerary, foto, jadwal keberangkatan, kuota PAX, add-on, dan kategori visa dari dashboard Tours → Products.',
            },
            {
                title: 'Atur kategori dan harga',
                description:
                    'Kelompokkan produk dengan Product Categories, Price Categories, dan Visa Categories untuk mempermudah pencarian.',
            },
            {
                title: 'Jelajahi katalog vendor (agen)',
                description:
                    'Agen dapat menelusuri katalog vendor terhubung, membandingkan paket, dan menambahkan produk ke katalog sendiri.',
            },
            {
                title: 'Pantau ketersediaan stok',
                description:
                    'Kuota PAX diperbarui otomatis saat ada booking baru sehingga risiko overbooking berkurang.',
            },
        ],
    },
    {
        id: 'bookings',
        title: 'Pemesanan',
        summary:
            'Proses booking dari permintaan hingga pembayaran, koreksi, dan dokumen perjalanan.',
        icon: BookOpen,
        audiences: ['vendor', 'agent', 'customer'],
        capabilities: [
            {
                title: 'Terima booking dari landing page',
                description:
                    'Pelanggan dapat memesan langsung dari landing page agen. Tim melihat dan mengelola statusnya di dashboard Bookings.',
            },
            {
                title: 'Kelola pembayaran',
                description:
                    'Terima transfer manual atau pembayaran online (Midtrans). Lacak status lunas, cicilan, dan tenggat waktu.',
            },
            {
                title: 'Koreksi booking',
                description:
                    'Ajukan atau proses permintaan perubahan data penumpang, jadwal, atau detail booking melalui Booking Correction.',
            },
            {
                title: 'Unduh invoice dan kelola dokumen',
                description:
                    'Cetak invoice untuk pelanggan dan kumpulkan dokumen perjalanan yang diperlukan sebelum keberangkatan.',
            },
        ],
    },
    {
        id: 'landing-page',
        title: 'Landing Page',
        summary:
            'Bangun halaman brand sendiri tanpa coding menggunakan editor visual.',
        icon: Layout,
        audiences: ['agent'],
        capabilities: [
            {
                title: 'Edit halaman dengan drag & drop',
                description:
                    'Gunakan editor Puck di Marketings → Edit Landing Page untuk menyusun hero, fitur, testimoni, FAQ, dan blok lainnya.',
            },
            {
                title: 'Sesuaikan branding',
                description:
                    'Ubah tema warna, logo, foto, dan teks agar landing page mencerminkan identitas agen Anda.',
            },
            {
                title: 'Hubungkan domain kustom',
                description:
                    'Gunakan subdomain TravelBoost atau domain sendiri melalui panduan DNS di Company Profile.',
            },
            {
                title: 'Pratinjau sebelum publikasi',
                description:
                    'Buka My Landing Page untuk melihat tampilan publik dan memastikan konten siap dibagikan ke pelanggan.',
            },
        ],
    },
    {
        id: 'marketing',
        title: 'Pemasaran & Analitik',
        summary:
            'Pantau performa digital, kelola anggaran promosi, dan persiapkan kampanye berbayar.',
        icon: BarChart3,
        audiences: ['agent'],
        capabilities: [
            {
                title: 'Hubungkan Google Analytics',
                description:
                    'Tautkan properti GA4 dari Marketings → Analytics untuk melihat traffic dan konversi landing page.',
            },
            {
                title: 'Hubungkan Meta Pixel',
                description:
                    'Sambungkan akun Facebook dan pilih pixel untuk melacak event dari kampanye media sosial.',
            },
            {
                title: 'Lihat ringkasan performa',
                description:
                    'Dashboard analitik menampilkan insight kunjungan dan interaksi tanpa perlu keluar dari TravelBoost.',
            },
            {
                title: 'Top-up anggaran promosi',
                description:
                    'Isi saldo promosi dari Marketings → Promotion Budget. Dana ini akan dipakai untuk kampanye Google dan Meta setelah fitur iklan dibuka.',
            },
            {
                title: 'Kampanye Google & Meta (segera)',
                description:
                    'Koneksi Google Ads dan Meta Ads serta pembuatan kampanye dari dashboard masih dalam tahap final. Saat ini ditandai Coming soon di halaman Promotion Budget dan Ad Campaigns.',
            },
        ],
    },
    {
        id: 'funds',
        title: 'Dana & Pembayaran',
        summary: 'Kelola wallet, komisi, penarikan, dan riwayat pembayaran.',
        icon: Wallet,
        audiences: ['vendor', 'agent'],
        capabilities: [
            {
                title: 'Lihat saldo wallet',
                description:
                    'Pantau saldo perusahaan dan mutasi komisi dari Funds → Wallet serta Wallet Transactions.',
            },
            {
                title: 'Kelola rekening bank',
                description:
                    'Daftarkan rekening penarikan di Bank Accounts agar dana dapat ditransfer dengan aman.',
            },
            {
                title: 'Ajukan penarikan',
                description:
                    'Tarik komisi atau saldo tersedia melalui Withdrawals setelah memenuhi kebijakan platform.',
            },
            {
                title: 'Lacak riwayat pembayaran',
                description:
                    'Cek Payment History untuk transaksi online, status settlement, dan referensi Midtrans.',
            },
        ],
    },
    {
        id: 'customers',
        title: 'Pelanggan',
        summary:
            'Kelola data pelanggan yang terdaftar melalui landing page agen.',
        icon: Users,
        audiences: ['agent'],
        capabilities: [
            {
                title: 'Lihat daftar pelanggan',
                description:
                    'Akses profil pelanggan, riwayat interaksi, dan status akun dari menu Customers.',
            },
            {
                title: 'Pelanggan multi-agen',
                description:
                    'Email yang sama dapat terdaftar di beberapa agen berbeda karena data pelanggan terikat per perusahaan.',
            },
            {
                title: 'Dukung pelanggan berulang',
                description:
                    'Gunakan riwayat booking untuk follow-up, upsell paket baru, atau penawaran khusus.',
            },
        ],
    },
    {
        id: 'chat',
        title: 'Live Chat & Chatbot',
        summary:
            'Komunikasi real-time dengan pengunjung dan pelanggan landing page.',
        icon: MessageSquare,
        audiences: ['agent', 'customer'],
        capabilities: [
            {
                title: 'Aktifkan live chat',
                description:
                    'Widget chat muncul di landing page agar pengunjung dapat bertanya tanpa harus menelepon.',
            },
            {
                title: 'Balas sebagai tim',
                description:
                    'Staf dengan izin yang sesuai dapat membalas percakapan dari dashboard atau widget mengambang.',
            },
            {
                title: 'Gunakan Chat AI',
                description:
                    'Aktifkan chatbot di Settings → Chat AI untuk menjawab pertanyaan umum secara otomatis di luar jam kerja.',
            },
            {
                title: 'Chat tanpa login (pengunjung)',
                description:
                    'Pengunjung anonim dapat mengirim pesan; mereka tidak perlu membuat akun terlebih dahulu.',
            },
        ],
    },
    {
        id: 'team',
        title: 'Tim & Akses',
        summary:
            'Atur siapa yang dapat melihat dan mengubah data di dashboard perusahaan.',
        icon: Users,
        audiences: ['vendor', 'agent'],
        capabilities: [
            {
                title: 'Undang anggota tim',
                description:
                    'Kirim undangan dari User Management dan tetapkan peran awal untuk setiap anggota.',
            },
            {
                title: 'Buat peran kustom',
                description:
                    'Definisikan Access Roles dengan kombinasi izin granular (tour, booking, wallet, settings, dll.).',
            },
            {
                title: 'Kelola status akun tim',
                description:
                    'Nonaktifkan atau ubah peran anggota yang pindah divisi tanpa menghapus riwayat aktivitas.',
            },
            {
                title: 'Hubungkan akun sosial',
                description:
                    'Tautkan Google atau Facebook dari Linked Accounts untuk integrasi analitik dan login yang lebih mudah.',
            },
        ],
    },
    {
        id: 'reports',
        title: 'Laporan',
        summary: 'Ekspor dan analisis data penjualan, komisi, dan operasional.',
        icon: BarChart3,
        audiences: ['vendor', 'agent'],
        capabilities: [
            {
                title: 'Laporan penjualan',
                description:
                    'Lihat ringkasan revenue dan tren penjualan per periode dari Sales Report.',
            },
            {
                title: 'Laporan komisi',
                description:
                    'Pantau komisi yang diterima agen atau dibayarkan vendor melalui Commission Report.',
            },
            {
                title: 'Daftar booking',
                description:
                    'Ekspor daftar booking untuk rekonsiliasi operasional atau kebutuhan akuntansi.',
            },
            {
                title: 'Room listings & seat availability (vendor)',
                description:
                    'Vendor dapat memantau alokasi kamar dan kursi per jadwal keberangkatan.',
            },
        ],
    },
    {
        id: 'commission',
        title: 'Pengaturan Komisi',
        summary: 'Vendor menetapkan struktur komisi untuk jaringan agen.',
        icon: Wallet,
        audiences: ['vendor'],
        capabilities: [
            {
                title: 'Kategori agen',
                description:
                    'Buat tier agen (misalnya Silver, Gold) dengan aturan komisi berbeda di Agent Categories.',
            },
            {
                title: 'Kategori produk komisi',
                description:
                    'Kelompokkan produk yang memiliki skema bagi hasil khusus melalui Product Commission Categories.',
            },
            {
                title: 'Atur komisi dasar per tour',
                description:
                    'Tetapkan persentase atau nominal komisi di Base Commission untuk setiap paket.',
            },
            {
                title: 'Tambahkan komisi tambahan',
                description:
                    'Berikan insentif ekstra berdasarkan jadwal, kuota, atau promosi melalui Additional Commission.',
            },
        ],
    },
    {
        id: 'customer-portal',
        title: 'Portal Pelanggan',
        summary:
            'Apa yang dapat dilakukan pelanggan setelah memesan di landing page agen.',
        icon: BookOpen,
        audiences: ['customer'],
        capabilities: [
            {
                title: 'Lacak booking saya',
                description:
                    'Pelanggan login dan membuka My Bookings untuk melihat status, jadwal bayar, dan detail perjalanan.',
            },
            {
                title: 'Bayar online atau upload bukti',
                description:
                    'Selesaikan pembayaran via Midtrans atau unggah bukti transfer sesuai instruksi agen.',
            },
            {
                title: 'Simpan tour favorit',
                description:
                    'Tandai paket yang menarik untuk dibandingkan atau dipesan nanti.',
            },
            {
                title: 'Unggah dokumen perjalanan',
                description:
                    'Kirim paspor, visa, atau dokumen lain yang diminta sebelum tanggal keberangkatan.',
            },
        ],
    },
];

export const defaultDocFeatureId = docFeatures[0]?.id ?? 'getting-started';

export function findDocFeature(id: string | null | undefined): DocFeature {
    return docFeatures.find((feature) => feature.id === id) ?? docFeatures[0]!;
}

export const audienceLabels: Record<DocAudience, string> = {
    all: 'Semua pengguna',
    vendor: 'Vendor',
    agent: 'Agen',
    customer: 'Pelanggan',
};
