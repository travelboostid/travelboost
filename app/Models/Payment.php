<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Payment extends Model
{
    use HasFactory;

    public const BOOKING_PAYMENT_TYPE_DOWN_PAYMENT = 'down_payment';

    public const BOOKING_PAYMENT_TYPE_FULL_PAYMENT = 'full_payment';

    /**
     * @var list<string>
     */
    private const BOOKING_PAYMENT_TYPES = [
        self::BOOKING_PAYMENT_TYPE_DOWN_PAYMENT,
        self::BOOKING_PAYMENT_TYPE_FULL_PAYMENT,
    ];

    protected $fillable = [
        'owner_id',
        'owner_type',
        'payable_id',
        'payable_type',
        'provider',
        'payment_method',
        'amount',
        'status',
        'payload',
        'expired_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => PaymentStatus::class,
            'payload' => 'array',
            'expired_at' => 'datetime',
            'paid_at' => 'datetime',
            'amount' => 'decimal:2',
        ];
    }

    public function owner(): MorphTo
    {
        return $this->morphTo();
    }

    public function payable(): MorphTo
    {
        return $this->morphTo();
    }

    public function bookingPaymentType(): ?string
    {
        $bookingPaymentType = data_get($this->payload, 'booking_payment_type');

        if (in_array($bookingPaymentType, self::BOOKING_PAYMENT_TYPES, true)) {
            return $bookingPaymentType;
        }

        $paymentType = data_get($this->payload, 'payment_type');

        if (in_array($paymentType, self::BOOKING_PAYMENT_TYPES, true)) {
            return $paymentType;
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>  $midtransPayload
     * @return array<string, mixed>
     */
    public static function mergeMidtransPayload(array $payload, array $midtransPayload): array
    {
        $bookingPaymentType = data_get($payload, 'booking_payment_type');

        if (! in_array($bookingPaymentType, self::BOOKING_PAYMENT_TYPES, true)) {
            $legacyPaymentType = data_get($payload, 'payment_type');
            $bookingPaymentType = in_array($legacyPaymentType, self::BOOKING_PAYMENT_TYPES, true)
                ? $legacyPaymentType
                : null;
        }

        $existingMidtransPayload = data_get($payload, 'midtrans');
        $payload['midtrans'] = array_merge(
            is_array($existingMidtransPayload) ? $existingMidtransPayload : [],
            $midtransPayload
        );

        if ($bookingPaymentType !== null) {
            $payload['booking_payment_type'] = $bookingPaymentType;
            $payload['payment_type'] = $bookingPaymentType;
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>  $prismaLinkPayload
     * @return array<string, mixed>
     */
    public static function mergePrismaLinkPayload(array $payload, array $prismaLinkPayload): array
    {
        $existingNotification = data_get($payload, 'prismalink_notification');
        $payload['prismalink_notification'] = array_merge(
            is_array($existingNotification) ? $existingNotification : [],
            $prismaLinkPayload
        );

        return $payload;
    }

    public function scopeWhereOwnerIn(
        Builder $query,
        array $owners
    ): Builder {
        $grouped = [];

        foreach ($owners as [$type, $id]) {
            $grouped[$type][] = $id;
        }

        return $query->where(function (Builder $query) use ($grouped) {
            foreach ($grouped as $type => $ids) {
                $query->orWhere(function (Builder $query) use ($type, $ids) {
                    $query
                        ->whereMorphedTo('owner', $type)
                        ->whereIn('owner_id', $ids);
                });
            }
        });
    }
}
