<?php

namespace Database\Seeders\Common;

use App\Enums\PaymentMethodCategory;
use App\Enums\PaymentMethodStatus;
use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    /**
     * @var list<array{
     *     method: string,
     *     category: PaymentMethodCategory,
     *     midtrans?: array{name: string, description: string, meta?: array<string, mixed>},
     *     prismalink?: array{name: string, description: string, meta?: array<string, mixed>},
     * }>
     */
    private const METHODS = [
        [
            'method' => 'bca_va',
            'category' => PaymentMethodCategory::BANK_TRANSFER,
            'midtrans' => [
                'name' => 'Midtrans BCA Virtual Account',
                'description' => 'Pay via BCA virtual account through Midtrans.',
                'meta' => ['enabled_payments' => ['bca_va']],
            ],
            'prismalink' => [
                'name' => 'PrismaLink BCA Virtual Account',
                'description' => 'Pay via BCA virtual account through PrismaLink.',
                'meta' => ['bank_id' => '014'],
            ],
        ],
        [
            'method' => 'mandiri_va',
            'category' => PaymentMethodCategory::BANK_TRANSFER,
            'midtrans' => [
                'name' => 'Midtrans Mandiri Virtual Account',
                'description' => 'Pay via Mandiri virtual account through Midtrans.',
                'meta' => ['enabled_payments' => ['echannel']],
            ],
            'prismalink' => [
                'name' => 'PrismaLink Mandiri Virtual Account',
                'description' => 'Pay via Mandiri virtual account through PrismaLink.',
                'meta' => ['bank_id' => '008'],
            ],
        ],
        [
            'method' => 'bni_va',
            'category' => PaymentMethodCategory::BANK_TRANSFER,
            'midtrans' => [
                'name' => 'Midtrans BNI Virtual Account',
                'description' => 'Pay via BNI virtual account through Midtrans.',
                'meta' => ['enabled_payments' => ['bni_va']],
            ],
            'prismalink' => [
                'name' => 'PrismaLink BNI Virtual Account',
                'description' => 'Pay via BNI virtual account through PrismaLink.',
                'meta' => ['bank_id' => '009'],
            ],
        ],
        [
            'method' => 'bri_va',
            'category' => PaymentMethodCategory::BANK_TRANSFER,
            'midtrans' => [
                'name' => 'Midtrans BRI Virtual Account',
                'description' => 'Pay via BRI virtual account through Midtrans.',
                'meta' => ['enabled_payments' => ['bri_va']],
            ],
            'prismalink' => [
                'name' => 'PrismaLink BRI Virtual Account',
                'description' => 'Pay via BRI virtual account through PrismaLink.',
                'meta' => ['bank_id' => '002'],
            ],
        ],
        [
            'method' => 'btn_va',
            'category' => PaymentMethodCategory::BANK_TRANSFER,
            'midtrans' => [
                'name' => 'Midtrans BTN Virtual Account',
                'description' => 'Pay via BTN virtual account through Midtrans.',
                'meta' => ['enabled_payments' => ['other_va']],
            ],
            'prismalink' => [
                'name' => 'PrismaLink BTN Virtual Account',
                'description' => 'Pay via BTN virtual account through PrismaLink.',
                'meta' => ['bank_id' => '200'],
            ],
        ],
        [
            'method' => 'permata_va',
            'category' => PaymentMethodCategory::BANK_TRANSFER,
            'midtrans' => [
                'name' => 'Midtrans Permata Virtual Account',
                'description' => 'Pay via Permata virtual account through Midtrans.',
                'meta' => ['enabled_payments' => ['permata_va']],
            ],
        ],
        [
            'method' => 'cimb_va',
            'category' => PaymentMethodCategory::BANK_TRANSFER,
            'midtrans' => [
                'name' => 'Midtrans CIMB Niaga Virtual Account',
                'description' => 'Pay via CIMB Niaga virtual account through Midtrans.',
                'meta' => ['enabled_payments' => ['cimb_va']],
            ],
        ],
        [
            'method' => 'danamon_va',
            'category' => PaymentMethodCategory::BANK_TRANSFER,
            'midtrans' => [
                'name' => 'Midtrans Danamon Virtual Account',
                'description' => 'Pay via Danamon virtual account through Midtrans.',
                'meta' => ['enabled_payments' => ['danamon_va']],
            ],
        ],
        [
            'method' => 'credit-card',
            'category' => PaymentMethodCategory::CREDIT_CARD,
            'midtrans' => [
                'name' => 'Midtrans Credit Card',
                'description' => 'Pay with credit or debit card via Midtrans.',
                'meta' => ['enabled_payments' => ['credit_card']],
            ],
            'prismalink' => [
                'name' => 'PrismaLink Credit Card',
                'description' => 'Pay with credit card via PrismaLink payment page.',
            ],
        ],
        [
            'method' => 'cstore',
            'category' => PaymentMethodCategory::CONVENIENCE_STORE,
            'midtrans' => [
                'name' => 'Midtrans Convenience Store',
                'description' => 'Pay at Alfamart or Indomaret via Midtrans.',
                'meta' => ['enabled_payments' => ['cstore']],
            ],
        ],
        [
            'method' => 'qris',
            'category' => PaymentMethodCategory::QRIS,
            'midtrans' => [
                'name' => 'Midtrans QRIS',
                'description' => 'Scan QRIS to pay via Midtrans.',
                'meta' => ['enabled_payments' => ['other_qris']],
            ],
        ],
        [
            'method' => 'qr',
            'category' => PaymentMethodCategory::QRIS,
            'prismalink' => [
                'name' => 'PrismaLink QRIS',
                'description' => 'Scan QRIS to pay via PrismaLink.',
            ],
        ],
    ];

    public function run(): void
    {
        PaymentMethod::query()
            ->whereIn('provider', ['midtrans', 'prismalink'])
            ->delete();

        foreach (self::METHODS as $method) {
            foreach (['midtrans', 'prismalink'] as $provider) {
                if (! isset($method[$provider])) {
                    continue;
                }

                $config = $method[$provider];

                PaymentMethod::updateOrCreate(
                    [
                        'provider' => $provider,
                        'method' => $method['method'],
                    ],
                    [
                        'name' => $config['name'],
                        'description' => $config['description'],
                        'category' => $method['category'],
                        'meta' => $config['meta'] ?? null,
                        'status' => PaymentMethodStatus::ENABLED,
                    ],
                );
            }
        }
    }
}
