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
     *     midtrans?: array{
     *         name: string,
     *         description: string,
     *         status?: PaymentMethodStatus,
     *         meta?: array<string, mixed>,
     *     },
     *     prismalink?: array{
     *         name: string,
     *         description: string,
     *         status?: PaymentMethodStatus,
     *         meta?: array<string, mixed>,
     *     },
     * }>
     */
    private const METHODS = [
        [
            'method' => 'bca_va',
            'category' => PaymentMethodCategory::BANK_TRANSFER,
            'midtrans' => [
                'name' => 'Midtrans BCA Virtual Account',
                'description' => 'Pay via BCA virtual account through Midtrans.',
                'meta' => ['payment_type' => 'bank_transfer', 'bank' => 'bca'],
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
                'name' => 'Midtrans Mandiri Bill Payment',
                'description' => 'Pay via Mandiri bill payment (E-Channel), not a VA number.',
                'meta' => ['payment_type' => 'echannel'],
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
                'meta' => ['payment_type' => 'bank_transfer', 'bank' => 'bni'],
            ],
            'prismalink' => [
                'name' => 'PrismaLink BNI Virtual Account',
                'description' => 'Pay via BNI virtual account through PrismaLink.',
                'status' => PaymentMethodStatus::DISABLED,
                'meta' => ['bank_id' => '009'],
            ],
        ],
        [
            'method' => 'bri_va',
            'category' => PaymentMethodCategory::BANK_TRANSFER,
            'midtrans' => [
                'name' => 'Midtrans BRI Virtual Account',
                'description' => 'Pay via BRI virtual account through Midtrans.',
                'meta' => ['payment_type' => 'bank_transfer', 'bank' => 'bri'],
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
            'prismalink' => [
                'name' => 'PrismaLink BTN Virtual Account',
                'description' => 'Pay via BTN virtual account through PrismaLink.',
                'status' => PaymentMethodStatus::DISABLED,
                'meta' => ['bank_id' => '200'],
            ],
        ],
        [
            'method' => 'permata_va',
            'category' => PaymentMethodCategory::BANK_TRANSFER,
            'midtrans' => [
                'name' => 'Midtrans Permata Virtual Account',
                'description' => 'Pay via Permata virtual account through Midtrans.',
                'meta' => ['payment_type' => 'bank_transfer', 'bank' => 'permata'],
            ],
        ],
        [
            'method' => 'cimb_va',
            'category' => PaymentMethodCategory::BANK_TRANSFER,
            'midtrans' => [
                'name' => 'Midtrans CIMB Niaga Virtual Account',
                'description' => 'Pay via CIMB Niaga virtual account through Midtrans.',
                'meta' => ['payment_type' => 'bank_transfer', 'bank' => 'cimb'],
            ],
            'prismalink' => [
                'name' => 'PrismaLink CIMB Niaga Virtual Account',
                'description' => 'Pay via CIMB Niaga virtual account through PrismaLink.',
                'meta' => ['bank_id' => '022'],
            ],
        ],
        [
            'method' => 'danamon_va',
            'category' => PaymentMethodCategory::BANK_TRANSFER,
            'midtrans' => [
                'name' => 'Midtrans Danamon Virtual Account',
                'description' => 'Pay via Danamon virtual account through Midtrans.',
                'status' => PaymentMethodStatus::DISABLED,
                'meta' => ['payment_type' => 'bank_transfer', 'bank' => 'danamon'],
            ],
        ],
        [
            'method' => 'credit-card',
            'category' => PaymentMethodCategory::CREDIT_CARD,
            'midtrans' => [
                'name' => 'Midtrans Credit Card',
                'description' => 'Unavailable: Midtrans Core API requires card tokenization.',
                'status' => PaymentMethodStatus::DISABLED,
                'meta' => ['payment_type' => 'credit_card'],
            ],
            'prismalink' => [
                'name' => 'PrismaLink Credit Card',
                'description' => 'Pay with credit card on the PrismaLink secure form.',
                'meta' => ['payment_method' => 'CC'],
            ],
        ],
        [
            'method' => 'cstore',
            'category' => PaymentMethodCategory::CONVENIENCE_STORE,
            'midtrans' => [
                'name' => 'Midtrans Convenience Store',
                'description' => 'Pay at Alfamart or Indomaret via Midtrans.',
                'meta' => ['payment_type' => 'cstore', 'store' => 'alfamart'],
            ],
        ],
        [
            'method' => 'qris',
            'category' => PaymentMethodCategory::QRIS,
            'midtrans' => [
                'name' => 'Midtrans QRIS',
                'description' => 'Unavailable: GoPay/ShopeePay QRIS is not activated on this Midtrans merchant. Use PrismaLink QRIS instead.',
                'status' => PaymentMethodStatus::DISABLED,
                'meta' => ['payment_type' => 'qris', 'acquirer' => 'gopay'],
            ],
        ],
        [
            'method' => 'qr',
            'category' => PaymentMethodCategory::QRIS,
            'prismalink' => [
                'name' => 'PrismaLink QRIS',
                'description' => 'Scan QRIS to pay via PrismaLink.',
                'meta' => ['payment_method' => 'QR'],
            ],
        ],
    ];

    public function run(): void
    {
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
                        'status' => $config['status'] ?? PaymentMethodStatus::ENABLED,
                    ],
                );
            }
        }
    }
}
