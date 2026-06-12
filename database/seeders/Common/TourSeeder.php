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
                ->forCompany($root)
                ->create();

            Tour::factory()
                ->count(2)
                ->for($root, 'company')
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
        $vendorVisaCategoryId = DB::table('visa_categories')
            ->where('company_id', $vendor->id)
            ->where('slug', 'visa-group-a')
            ->value('id');

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
                'visa_category_id' => $vendorVisaCategoryId,
                'image_id' => null,
                'document_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $this->command->info("10 China tours seeded for vendor company (ID: {$vendor->id}).");

        $greatChina = Company::where('username', 'greatchinatour')->first();

        if (! $greatChina) {
            $this->command->warn("Company 'greatchinatour' not found. Skipping greatchinatour seeding.");

            return;
        }

        $greatChinaTours = [
            [
                'code' => 'GCT-CHQ-JZH-8D',
                'name' => '8D Chongqing Jiuzhaigou',
                'description' => 'Perjalanan 8 hari menjelajahi pesona Chongqing dan keajaiban alam Jiuzhaigou. '
                  .'Nikmati Liziba Light Rail Through The Building, Ciqikou Ancient Town, '
                  .'Jiuzhaigou National Park (Mirror Lake, Pearl Waterfall, Five Color Pond, Long Lake), '
                  .'Dujiangyan Panda Park, serta Hongya Cave dan Liberation Monument di Chongqing. '
                  .'Termasuk bullet train Chengdu–Jiuzhaigou. Hotel bintang 4 lokal.',
                'duration_days' => 8,
                'destination' => 'Chongqing – Chengdu – Jiuzhaigou',
                'showprice' => 13900000,
            ],
            [
                'code' => 'GCT-ZJJ-HRB-9D',
                'name' => '9D Zhangjiajie Harbin & Snow Town',
                'description' => 'Paket 9 hari menggabungkan keindahan alam Zhangjiajie dengan pesona musim dingin '
                  .'Harbin dan Snow Town. Highlight: Baofeng Lake, Three Gorges & Gezhouba Lock, '
                  .'Harbin Ice & Snow World, Xuexiang (Snow Town) Fairy-tale World Boardwalk, '
                  .'Yabuli Skiing Asian Winter Games 2025, Fireworks Show Tahun Baru, '
                  .'Sophia Cathedral, dan Dalian Xinghai Square. '
                  .'Keberangkatan 28 Desember 2025. Hotel bintang 4.',
                'duration_days' => 9,
                'destination' => 'Zhangjiajie – Yichang – Dalian – Harbin – Snow Town',
                'showprice' => 25500000,
            ],
            [
                'code' => 'GCT-ZJJ-FHC-9D-QG',
                'name' => '9D Zhangjiajie Fenghuang Chongqing (Citilink)',
                'description' => 'Paket 9 hari dengan penerbangan Citilink langsung Jakarta–Zhangjiajie. '
                  .'Jelajahi Phoenix Ancient Town (Tuojiang Scenery, Wanming Tower), '
                  .'Hongya Cave, Liziba Light Rail, Hotpot di Pipayuan, '
                  .'Zhangjiajie National Forest Park, Avatar Mountain (Bailong Lift), '
                  .'Golden Whip Stream, dan Grand Canyon Glass Bridge (opsional). '
                  .'Optional tour Tianmen Mountain (cable car + glass bridge + Tianmen Cave). '
                  .'Hotel bintang 4–5 lokal.',
                'duration_days' => 9,
                'destination' => 'Zhangjiajie – Fenghuang – Chongqing',
                'showprice' => 12900000,
            ],
            [
                'code' => 'GCT-ZJJ-FRZ-FHG-9D',
                'name' => '9D Zhangjiajie Furongzhen Fenghuang (Citilink)',
                'description' => 'Paket 9 hari eksklusif menjelajahi Furongzhen, Fenghuang, dan Zhangjiajie '
                  .'dengan penerbangan langsung Citilink. Highlight: Furongzhen Waterfall & Shiban Street, '
                  .'Shen Congwen\'s Biancheng (tiga provinsi), Fenghuang Phoenix Ancient Town, '
                  .'Miao Village (desa 1.000 tahun), Tusi Town, '
                  .'Zhangjiajie National Forest Park, Avatar Mountain (Bailong Lift), '
                  .'Golden Whip Stream, Ten Miles Gallery. '
                  .'Optional: Tianmen Mountain & Meili Xiangxi Song and Dance Show. '
                  .'Hotel bintang 4.',
                'duration_days' => 9,
                'destination' => 'Zhangjiajie – Furongzhen – Fenghuang',
                'showprice' => 9999000,
            ],
            [
                'code' => 'GCT-ZJJ-FHC-9D-FT',
                'name' => '9D Zhangjiajie Fenghuang Chongqing',
                'description' => 'Paket 9 hari menelusuri tiga destinasi ikonik: Zhangjiajie, Fenghuang, '
                  .'dan Chongqing. Kunjungi Phoenix Ancient Town (Tuojiang Scenery, Shiban Old Street), '
                  .'Ciqikou Ancient Town, Hotpot spesial di Pipayuan, Hongya Cave, '
                  .'Liziba Light Railway, Zhuoshui Ancient Town & Jembatan Pelangi Terbesar Asia, '
                  .'Zhangjiajie National Forest Park, Avatar Mountain, Golden Whip Stream. '
                  .'Optional: Tianmen Mountain, Grand Canyon Glass Bridge. '
                  .'Hotel bintang 4–5 lokal.',
                'duration_days' => 9,
                'destination' => 'Zhangjiajie – Fenghuang – Chongqing',
                'showprice' => 12900000,
            ],
            [
                'code' => 'GCT-KMG-SHL-9D',
                'name' => '9D Balagezong Shangri-La',
                'description' => 'Perjalanan 9 hari menelusuri keindahan Yunnan: Kunming, Dali, Lijiang, '
                  .'Balagezong, dan Shangri-La. Highlight: Dali Santorini (battery car + afternoon tea), '
                  .'Lashi Lake Wetland Park, Balagezong Bonfire Party, Bala Village & Dolma Lhakhang, '
                  .'Shangri-La Grand Canyon, Echo Wall & Glass Viewing Platform, '
                  .'Napahai Lake, Dukezong Ancient City (kota Tibet terbesar & paling terawat), '
                  .'Turtle Hill Park & Prayer Wheel, Lijiang Ancient Town (Warisan UNESCO). '
                  .'Optional: Tiger Leaping Gorge, Jade Dragon Snow Mountain. Hotel bintang 4–5.',
                'duration_days' => 9,
                'destination' => 'Kunming – Dali – Lijiang – Balagezong – Shangri-La',
                'showprice' => 12900000,
            ],
            [
                'code' => 'GCT-BJS-SHA-8D',
                'name' => '8D Beijing Huadong & Shanghai',
                'description' => 'Paket 8 hari mengeksplorasi empat kota besar Tiongkok via Air Macau. '
                  .'Beijing: Tiananmen Square, Forbidden City, Temple of Heaven (UNESCO), '
                  .'Great Wall of China, Bird Nest Stadium, Wangfujing Street. '
                  .'Suzhou: Ou Garden & Shantang Street (Venesia dari Timur). '
                  .'Shanghai: The Bund, Chenghuangmiao, Nanjing Road. '
                  .'Hangzhou: West Lake (perahu) & Hefangjie. '
                  .'Kereta cepat Beijing–Suzhou. Tiket tidak bisa di-extend.',
                'duration_days' => 8,
                'destination' => 'Beijing – Suzhou – Shanghai – Hangzhou',
                'showprice' => 11990000,
            ],
            [
                'code' => 'GCT-CHQ-ZJJ-8D',
                'name' => '8D Chongqing Zhangjiajie',
                'description' => 'Petualangan 8 hari melintasi Chongqing, Fenghuang, dan Zhangjiajie. '
                  .'Jelajahi Fenghuang Ancient Town (Wanming Tower, Bar Street malam hari), '
                  .'Furong Ancient Town (kapal + battery car, lebih 2.000 tahun), '
                  .'The 72 Tujia Stilted Buildings, Zhangjiajie National Forest Park '
                  .'(Bailong Elevator, Avatar Mountain, Golden Whip Brook), '
                  .'Grand Canyon (VR + Glass Bridge + Boat), Liziba Light Rail, '
                  .'Hongya Cave, Liberation Monument, dan Pipa Yuan Hot Pot. '
                  .'Optional: Tianmen Fox Fairy Show & Tianmen Mountain. Hotel bintang 4–5.',
                'duration_days' => 8,
                'destination' => 'Chongqing – Fenghuang – Yongshun – Zhangjiajie – Pengshui',
                'showprice' => 12900000,
            ],
            [
                'code' => 'GCT-CHQ-BSV-8D',
                'name' => '8D Best Saver Chongqing',
                'description' => 'Paket hemat 8 hari fokus di Chongqing dan Tongjing. '
                  .'Kunjungi Kuixing Building (22 lantai), Chongqing Art Museum, '
                  .'Liberation Monument & Walking Street, Hongya Cave, Raffles City Chongqing, '
                  .'Chongqing Garden Expo Park (3.300 ha), The Ring Shopping Park, '
                  .'Tongjing Hot Spring Scenic Spot (wisata 5A, pemandian air panas mineral), '
                  .'Chongqing Republic Street, Great Hall of the People, '
                  .'Liziba Light Rail, dan Ciqikou Ancient Town. '
                  .'Optional: Two Rivers Night Tour, Chongqing 1949 Show, Wulong Tiankeng. '
                  .'Hotel bintang 4–5 lokal.',
                'duration_days' => 8,
                'destination' => 'Chongqing – Tongjing',
                'showprice' => 9900000,
            ],
            [
                'code' => 'GCT-CDU-EMS-7D',
                'name' => '7D Chengdu Emeishan',
                'description' => 'Paket 7 hari menjelajahi Chengdu dan Gunung Emei via Air Macau. '
                  .'Highlight: Dujiangyan Panda Paradise (electric car), The Giant Buddha Leshan (71m), '
                  .'Zhanggong Bridge Food Street, Baoguo Temple & Fuhu Temple, '
                  .'Emei Mountain Ebony Museum, Suji Ancient Town (1.400+ tahun), '
                  .'Jinli Ancient Street, Kuanzhai Alley (Dinasti Qing), '
                  .'Chunxi Road, Taikoo Li, IFS Panda Climbing the Wall. '
                  .'Optional: Furong Guocui Sichuan Opera Face Changing Show. '
                  .'Transit Macau (termasuk 1 malam). Hotel bintang 4.',
                'duration_days' => 7,
                'destination' => 'Macau – Chengdu – Dujiangyan – Emeishan',
                'showprice' => 9980000,
            ],
        ];

        foreach ($greatChinaTours as $tour) {
            $greatChinaVisaCategoryId = DB::table('visa_categories')
                ->where('company_id', $greatChina->id)
                ->where('slug', 'visa-group-a')
                ->value('id');

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
                'company_id' => $greatChina->id,
                'continent_id' => 1,
                'region_id' => 1,
                'country_id' => 12,
                'category_id' => null,
                'visa_category_id' => $greatChinaVisaCategoryId,
                'image_id' => null,
                'document_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $this->command->info("10 Great China tours seeded for greatchinatour company (ID: {$greatChina->id}).");
    }
}
