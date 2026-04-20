<?php

namespace Database\Seeders\Common;

use App\Models\Company;
use App\Models\Tour;
use App\Models\TourCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TourSeeder extends Seeder
{
    public function run(): void
    {
        $root = Company::where('username', 'root')->first();

        if ($root) {
            TourCategory::factory()
                ->count(2)
                ->forCompany($root) // attach to this company
                ->create();

            // Use the TourFactory to create 2 tours
            Tour::factory()
                ->count(2)
                ->for($root, 'company') // attach to the company relation
                ->create();
        }

        $vendor = Company::where('username', 'vendor')->first();

        if (! $vendor) {
            $this->command->warn("Company 'vendor' not found. Skipping China tour seeding.");

            return;
        }

        $tours = [
            [
                'code' => 'CHN-001',
                'name' => 'Beijing Imperial Splendor',
                'description' => 'Jelajahi kejayaan kekaisaran China di Beijing: Kota Terlarang, Tembok Besar, dan Istana Musim Panas dalam satu perjalanan tak terlupakan.',
                'duration_days' => 5,
                'destination' => 'Beijing',
                'showprice' => 8500000,
            ],
            [
                'code' => 'CHN-002',
                'name' => 'Shanghai Modern & Classic Tour',
                'description' => 'Rasakan kontras memukau antara Shanghai modern dengan Bund ikonik, Yu Garden bersejarah, dan kawasan seni M50.',
                'duration_days' => 4,
                'destination' => 'Shanghai',
                'showprice' => 7200000,
            ],
            [
                'code' => 'CHN-003',
                'name' => 'Xi\'an Silk Road Discovery',
                'description' => 'Susuri jalur sutra kuno di Xi\'an, kunjungi Pasukan Terakota legendaris, Masjid Agung, dan Tembok Kota Xi\'an yang megah.',
                'duration_days' => 4,
                'destination' => 'Xi\'an',
                'showprice' => 7800000,
            ],
            [
                'code' => 'CHN-004',
                'name' => 'Guilin & Yangshuo River Cruise',
                'description' => 'Nikmati keindahan alam surga yang sesungguhnya: cruise Sungai Li diantara karst hijau berliku, desa etnik Yangshuo, dan ladang padi bertingkat.',
                'duration_days' => 5,
                'destination' => 'Guilin & Yangshuo',
                'showprice' => 9100000,
            ],
            [
                'code' => 'CHN-005',
                'name' => 'Chengdu Panda & Sichuan Culture',
                'description' => 'Bertemu panda raksasa di Chengdu Research Base, cicipi kuliner pedas Sichuan autentik, dan kunjungi kawasan bersejarah Jinli Ancient Street.',
                'duration_days' => 4,
                'destination' => 'Chengdu',
                'showprice' => 7500000,
            ],
            [
                'code' => 'CHN-006',
                'name' => 'Zhangjiajie Avatar Mountain Trek',
                'description' => 'Saksikan panorama dramatis Zhangjiajie, inspirasi film Avatar: pilar-pilar batu setinggi langit, jembatan kaca terpanjang, dan hutan nasional memukau.',
                'duration_days' => 5,
                'destination' => 'Zhangjiajie',
                'showprice' => 9800000,
            ],
            [
                'code' => 'CHN-007',
                'name' => 'Hangzhou & Suzhou Water Towns',
                'description' => 'Rasakan pesona "surga di bumi": berjalan di tepi Danau Barat Hangzhou, susuri kanal-kanal Suzhou, dan kunjungi taman klasik UNESCO.',
                'duration_days' => 4,
                'destination' => 'Hangzhou & Suzhou',
                'showprice' => 7000000,
            ],
            [
                'code' => 'CHN-008',
                'name' => 'Yunnan Diversity Explorer',
                'description' => 'Temukan keanekaragaman budaya dan alam Yunnan: Kota Tua Lijiang, Lembah Batu Berbentuk Hati, Tiger Leaping Gorge, dan desa-desa etnik Naxi.',
                'duration_days' => 6,
                'destination' => 'Kunming & Lijiang',
                'showprice' => 10500000,
            ],
            [
                'code' => 'CHN-009',
                'name' => 'Tibet Sacred Journey',
                'description' => 'Ziarah spiritual ke Atap Dunia: Istana Potala Lhasa, Biara Sera, Danau Suci Namtso, dan pemandangan Himalaya yang memanjakan jiwa.',
                'duration_days' => 7,
                'destination' => 'Lhasa, Tibet',
                'showprice' => 14500000,
            ],
            [
                'code' => 'CHN-010',
                'name' => 'Hong Kong City Escape',
                'description' => 'Eksplorasi kota metropolitan Asia Timur: Victoria Peak, Temple Street Night Market, Disneyland Hong Kong, dan kuliner dim sum terbaik.',
                'duration_days' => 3,
                'destination' => 'Hong Kong',
                'showprice' => 6500000,
            ],
        ];

        $now = now();

        foreach ($tours as $tour) {
            DB::table('tours')->insert([
                'code' => $tour['code'],
                'name' => $tour['name'],
                'description' => $tour['description'],
                'duration_days' => $tour['duration_days'],
                'status' => 'active',
                'destination' => $tour['destination'],
                'continent_name' => 'Asia',
                'region_name' => 'East Asia',
                'country_name' => 'China',
                'showprice' => $tour['showprice'],
                'earlybird' => 0,
                'earlybird_note' => '',
                'promoprice' => 0,
                'promote_price' => 0,
                'company_id' => $vendor->id,
                'continent_id' => 1,
                'region_id' => 1,
                'country_id' => 12,
                'category_id' => null,
                'image_id' => null,
                'document_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $this->command->info("10 China tours seeded for vendor company (ID: {$vendor->id}).");
    }
}
