<?php

namespace App\Actions\Booking;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\Transaction;
use App\Models\User;
use App\Services\BookingPricingService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SettleFullPaymentCommissionsAction
{
    public const TYPE_AGENT_COMMISSION = 'booking-agent-commission';

    public const TYPE_TRAVELBOOST_COMMISSION = 'booking-travelboost-commission';

    public const TYPE_PLATFORM_FEE = 'booking-platform-fee';

    public function __construct(private readonly BookingPricingService $pricingService) {}

    /**
     * @param  array<string, mixed>|null  $quote
     */
    public function assertCanSettle(Booking $booking, ?array $quote = null): void
    {
        $booking->loadMissing(['vendor.wallet', 'agent.wallet', 'tour', 'passengers', 'addons']);
        $quote ??= $this->pricingService->quoteForBooking($booking);

        $pendingAmount = $this->pendingSettlements($booking, $quote)
            ->sum(fn (array $settlement): float => (float) $settlement['amount']);

        if ($pendingAmount <= 0) {
            return;
        }

        $vendorWallet = $booking->vendor?->wallet;
        if (! $vendorWallet || (float) $vendorWallet->balance < $pendingAmount) {
            throw ValidationException::withMessages([
                'wallet' => 'Vendor wallet balance is insufficient to settle booking commissions and fees.',
            ]);
        }
    }

    /**
     * @param  array<string, mixed>|null  $quote
     */
    public function execute(Booking $booking, ?Payment $payment = null, ?array $quote = null): void
    {
        DB::transaction(function () use ($booking, $payment, $quote): void {
            $booking->loadMissing(['vendor.wallet', 'agent.wallet', 'tour', 'passengers', 'addons']);
            $quote ??= $this->pricingService->quoteForBooking($booking);

            $this->assertCanSettle($booking, $quote);

            foreach ($this->pendingSettlements($booking, $quote) as $settlement) {
                $this->transfer(
                    $booking,
                    (string) $settlement['type'],
                    (string) $settlement['description'],
                    (float) $settlement['amount'],
                    $settlement['receiver'],
                    (array) $settlement['breakdown'],
                    $payment,
                );
            }
        });
    }

    /**
     * @param  array<string, mixed>  $quote
     * @return Collection<int, array<string, mixed>>
     */
    private function pendingSettlements(Booking $booking, array $quote): Collection
    {
        $root = null;
        $rootWallet = function () use (&$root) {
            $root ??= $this->resolveRootWallet();

            return $root;
        };

        $settlements = [
            [
                'type' => self::TYPE_AGENT_COMMISSION,
                'description' => $this->settlementDescription($booking, 'Agent commission'),
                'amount' => $booking->agent_id ? (float) $quote['agent_commission'] : 0.0,
                'receiver' => $booking->agent?->wallet,
                'breakdown' => $quote['agent_commission_breakdown'] ?? [],
            ],
        ];

        if ((float) $quote['travelboost_commission'] > 0) {
            $settlements[] = [
                'type' => self::TYPE_TRAVELBOOST_COMMISSION,
                'description' => $this->settlementDescription($booking, 'Travelboost commission'),
                'amount' => (float) $quote['travelboost_commission'],
                'receiver' => $rootWallet(),
                'breakdown' => $quote['travelboost_commission_breakdown'] ?? [],
            ];
        }

        if ((float) $quote['platform_fee'] > 0) {
            $settlements[] = [
                'type' => self::TYPE_PLATFORM_FEE,
                'description' => $this->settlementDescription($booking, 'Platform fee'),
                'amount' => (float) $quote['platform_fee'],
                'receiver' => $rootWallet(),
                'breakdown' => [
                    'source' => (string) ($quote['source'] ?? 'booking_snapshot'),
                    'platform_fee' => (float) $quote['platform_fee'],
                    'platform_fee_per_pax' => (float) $quote['platform_fee_per_pax'],
                    'pax_count' => (int) $quote['pax_count'],
                ],
            ];
        }

        return collect($settlements)
            ->filter(fn (array $settlement): bool => (float) $settlement['amount'] > 0)
            ->filter(fn (array $settlement): bool => $settlement['receiver'] !== null)
            ->reject(fn (array $settlement): bool => $this->hasSettlement($booking, (string) $settlement['type']))
            ->values();
    }

    private function settlementDescription(Booking $booking, string $label): string
    {
        $contactName = trim((string) $booking->contact_name) ?: 'Booking customer';
        $totalPax = max(
            0,
            (int) $booking->pax_adult + (int) $booking->pax_child + (int) $booking->pax_infant
        );

        return "{$label} for {$contactName} ({$totalPax} pax) booking {$booking->booking_number}";
    }

    private function hasSettlement(Booking $booking, string $type): bool
    {
        return Transaction::query()
            ->where('meta->type', $type)
            ->where('meta->booking_id', $booking->id)
            ->exists();
    }

    /**
     * @param  array<string, mixed>|array<int, array<string, mixed>>  $breakdown
     */
    private function transfer(
        Booking $booking,
        string $type,
        string $description,
        float $amount,
        mixed $receiverWallet,
        array $breakdown,
        ?Payment $payment,
    ): void {
        $vendorWallet = $booking->vendor?->wallet;
        if (! $vendorWallet) {
            throw ValidationException::withMessages([
                'wallet' => 'Vendor wallet is not configured.',
            ]);
        }

        $meta = [
            'type' => $type,
            'description' => $description,
            'booking_id' => $booking->id,
            'booking_number' => $booking->booking_number,
            'payment_id' => $payment?->id,
            'vendor_id' => $booking->vendor_id,
            'agent_id' => $booking->agent_id,
            'amount' => $amount,
            'breakdown' => $breakdown,
        ];

        $integerAmount = (int) round($amount);

        $vendorWallet->withdraw($integerAmount, $meta);
        $receiverWallet->deposit($integerAmount, $meta);
    }

    private function resolveRootWallet(): mixed
    {
        $root = User::query()
            ->where('username', 'root')
            ->orWhere('email', 'root@travelboost.co.id')
            ->first();

        if (! $root?->wallet) {
            throw ValidationException::withMessages([
                'wallet' => 'Travelboost root wallet is not configured.',
            ]);
        }

        return $root->wallet;
    }
}
