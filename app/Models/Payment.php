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
     * @var list<string>
     */
    private const MIDTRANS_NOTIFICATION_FIELDS = [
        'transaction_status',
        'transaction_id',
        'order_id',
        'payment_type',
        'fraud_status',
        'status_code',
        'settlement_time',
        'status_message',
    ];

    /**
     * @var list<string>
     */
    private const PRISMALINK_NOTIFICATION_FIELDS = [
        'payment_status',
        'transaction_status',
        'payment_date',
        'bank_ref_no',
        'plink_ref_no',
        'payment_method',
        'merchant_ref_no',
        'transaction_amount',
        'validity',
        'bank_id',
    ];

    /**
     * @var list<string>
     */
    private const LEGACY_GATEWAY_PAYLOAD_KEYS = [
        'midtrans',
        'prismalink',
        'prismalink_notification',
        'request',
    ];

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function gatewayNotificationData(array $payload): array
    {
        $flat = self::onlyGatewayFields($payload);

        if ($flat !== []) {
            return $flat;
        }

        foreach (['midtrans', 'prismalink', 'prismalink_notification'] as $legacyKey) {
            $legacyPayload = data_get($payload, $legacyKey);

            if (! is_array($legacyPayload)) {
                continue;
            }

            $legacyFlat = self::onlyGatewayFields($legacyPayload);

            if ($legacyFlat !== []) {
                return $legacyFlat;
            }
        }

        return [];
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

        $payload = self::mergeGatewayFields($payload, $midtransPayload, self::MIDTRANS_NOTIFICATION_FIELDS);
        $payload = self::stripLegacyGatewayPayloadKeys($payload);

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
        $payload = self::mergeGatewayFields($payload, $prismaLinkPayload, self::PRISMALINK_NOTIFICATION_FIELDS);
        $payload = self::stripLegacyGatewayPayloadKeys($payload);

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<string>  $fields
     * @return array<string, mixed>
     */
    private static function onlyGatewayFields(array $payload, array $fields = []): array
    {
        $fields = $fields === [] ? array_merge(self::MIDTRANS_NOTIFICATION_FIELDS, self::PRISMALINK_NOTIFICATION_FIELDS) : $fields;
        $selected = [];

        foreach ($fields as $field) {
            if (! array_key_exists($field, $payload) || $payload[$field] === null || $payload[$field] === '') {
                continue;
            }

            if ($field === 'payment_type' && in_array($payload[$field], self::BOOKING_PAYMENT_TYPES, true)) {
                continue;
            }

            $selected[$field] = $payload[$field];
        }

        return $selected;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>  $notification
     * @param  list<string>  $fields
     * @return array<string, mixed>
     */
    private static function mergeGatewayFields(array $payload, array $notification, array $fields): array
    {
        foreach (self::onlyGatewayFields($notification, $fields) as $field => $value) {
            $payload[$field] = $value;
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private static function stripLegacyGatewayPayloadKeys(array $payload): array
    {
        foreach (self::LEGACY_GATEWAY_PAYLOAD_KEYS as $legacyKey) {
            unset($payload[$legacyKey]);
        }

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
