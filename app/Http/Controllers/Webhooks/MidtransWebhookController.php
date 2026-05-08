<?php

namespace App\Http\Controllers\Webhooks;

use App\Enums\AgentSubscriptionStatus;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\AgentSubscriptionPackage;
use App\Models\AppConfig;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\NewReferralNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use SnapBi\SnapBi;

class MidtransWebhookController extends Controller
{
    public function handleNotification(Request $request): JsonResponse
    {
        if (! $this->isWebhookVerified($request)) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        $payload = $request->all();
        $transactionId = $payload['order_id'] ?? null;

        if (! $transactionId) {
            return response()->json(['error' => 'No order ID'], 400);
        }

        $payment = $this->findPayment($transactionId);

        if (! $payment) {
            return response()->json(['error' => 'Payment not found'], 404);
        }

        if ($this->isAlreadyProcessed($payment)) {
            return response()->json(['message' => 'Payment already processed']);
        }

        $newStatus = $this->mapMidtransStatus($payload['transaction_status'] ?? 'pending');

        if ($newStatus === PaymentStatus::PAID) {
            $this->processPayment($payment);
        }

        $payment->update([
            'status' => $newStatus,
            'payload' => array_merge($payment->payload ?? [], $payload),
            'paid_at' => $newStatus === PaymentStatus::PAID ? now() : null,
        ]);

        return response()->json(['message' => 'Webhook processed']);
    }

    private function isWebhookVerified(Request $request): bool
    {
        if (app()->environment('local', 'development', 'testing')) {
            return true;
        }

        $notificationUrlPath = config('app.url').'/webhooks/midtrans/notification';
        $verified = SnapBi::notification()
            ->withBody($request->getContent())
            ->withSignature($request->header('X-Signature'))
            ->withTimeStamp($request->header('X-Timestamp'))
            ->withNotificationUrlPath($notificationUrlPath)
            ->isWebhookNotificationVerified();

        if (! $verified) {
            Log::warning('Midtrans webhook signature verification failed', [
                'payload' => $request->all(),
                'headers' => $request->headers->all(),
            ]);
        }

        return $verified;
    }

    private function findPayment(string $transactionId): ?Payment
    {
        $paymentId = Str::before($transactionId, '-');

        return Payment::find($paymentId);
    }

    private function isAlreadyProcessed(Payment $payment): bool
    {
        return $payment->status === PaymentStatus::PAID;
    }

    private function mapMidtransStatus($midtransStatus)
    {
        return match ($midtransStatus) {
            'capture', 'settlement' => PaymentStatus::PAID,
            'pending' => PaymentStatus::PENDING,
            'deny', 'cancel', 'expire' => PaymentStatus::FAILED,
            default => PaymentStatus::PENDING,
        };
    }

    private function processPayment(Payment $payment): void
    {
        match ($payment->payable_type) {
            Booking::class => $this->processBookingPayment($payment),
            'agent-subscription-payment' => $this->processAgentSubscription($payment),
            'wallet-topup-payment' => $this->processWalletTopup($payment),
            'ai-credit-topup-payment' => $this->processAiCreditTopup($payment),
            default => $this->logUnknownPayableType($payment),
        };
    }

    private function processBookingPayment(Payment $payment): void
    {
        $payment->load('payable');
        $booking = $payment->payable;

        if (! $booking instanceof Booking) {
            Log::error('Booking payable not found', ['payment_id' => $payment->id]);

            return;
        }

        $paymentType = $payment->payload['payment_type'] ?? 'full_payment';

        $booking->update([
            'status' => $paymentType === 'down_payment'
              ? BookingStatus::DOWN_PAYMENT
              : BookingStatus::FULL_PAYMENT,
            'payment_mode' => 'online',
        ]);
    }

    private function processAgentSubscription(Payment $payment): void
    {
        Log::info('Processing agent subscription', ['payment_id' => $payment->id]);

        $owner = $payment->owner;
        if (! $owner) {
            Log::error('Owner not found', ['payment_id' => $payment->id]);

            return;
        }

        $package = $this->getAgentSubscriptionPackage($payment);
        if (! $package) {
            return;
        }

        $existingSubscription = $owner->agentSubscription()->first();

        if (! $existingSubscription) {
            $this->createNewSubscription($owner, $package);
        } else {
            $this->renewSubscription($existingSubscription, $package);
        }

        // --- MENGAKTIFKAN SUBDOMAIN AGEN ---
        $domain = \App\Models\Domain::where('owner_id', $owner->id)
            ->where('owner_type', 'company')
            ->first();

        if ($domain) {
            $domain->update([
                'subdomain_enabled' => true,
                'domain_enabled' => true,
            ]);
            Log::info('Subdomain berhasil diaktifkan untuk agen', ['company_id' => $owner->id]);
        } else {
            Log::warning('Data domain tidak ditemukan untuk agen ini', ['company_id' => $owner->id]);
        }

        $appConfig = AppConfig::where('key', 'admin')->first();
        $adminConfig = $appConfig ? $appConfig->value : [];

        $freeAiAfterSub = isset($adminConfig['free_AI_after_subscription']) ? (float) $adminConfig['free_AI_after_subscription'] : 0;

        if ($freeAiAfterSub > 0) {
            $aiCredit = $owner->aiCredit()->first();
            if ($aiCredit) {
                $aiCredit->increment('balance', $freeAiAfterSub);
            } else {
                $owner->aiCredit()->create([
                    'balance' => $freeAiAfterSub,
                ]);
            }
        }

        // Hitung Harga Dasar Komisi (Harga Paket dikurangi PPN 11%)
        $ppnAmount = $package->price * 0.11;
        $commissionBasePrice = $package->price - $ppnAmount;

        if (isset($owner->referred_by) && $owner->referred_by != null) {
            $affiliateUser = User::find($owner->referred_by);
            if ($affiliateUser) {
                $affiliateProfile = AffiliateProfile::where('user_id', $affiliateUser->id)->first();
                if ($affiliateProfile) {

                    $affCommissionRate = isset($adminConfig['affiliate_commission']) ? (float) $adminConfig['affiliate_commission'] : 0;
                    // Gunakan Harga Dasar Komisi yang sudah dikurangi PPN
                    $affCommissionAmount = ($commissionBasePrice * $affCommissionRate) / 100;

                    if ($affCommissionAmount > 0) {
                        $affiliateUser->wallet->deposit($affCommissionAmount, [
                            'type' => 'commission',
                            'description' => 'Subscription commission from Agent '.$owner->name,
                            'payment_id' => $payment->id,
                        ]);

                        DB::table('affiliate_commission_histories')->insert([
                            'company_id' => $owner->id,
                            'payment_id' => $payment->id,
                            'recipient_id' => $affiliateUser->id,
                            'tier' => 'affiliate',
                            'base_amount' => $commissionBasePrice,
                            'commission_rate' => $affCommissionRate,
                            'commission_amount' => $affCommissionAmount,
                            'status' => 'paid',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        $title = "Langganan Berhasil: {$owner->name}";
                        $message = "Agen {$owner->name} telah berhasil membayar paket langganan. Komisi afiliasi telah ditambahkan ke dalam dompet Anda.";
                        $affiliateUser->notify(new NewReferralNotification($title, $message));
                    }

                    if ($affiliateProfile->upline_id) {
                        $maUser = User::find($affiliateProfile->upline_id);
                        if ($maUser) {
                            $maProfile = AffiliateProfile::where('user_id', $maUser->id)->first();

                            $maCommissionRate = isset($adminConfig['ma_commission']) ? (float) $adminConfig['ma_commission'] : 0;
                            // Gunakan Harga Dasar Komisi yang sudah dikurangi PPN
                            $maCommissionAmount = ($commissionBasePrice * $maCommissionRate) / 100;

                            if ($maCommissionAmount > 0) {
                                $maUser->wallet->deposit($maCommissionAmount, [
                                    'type' => 'commission',
                                    'description' => 'MA Subscription commission from Agent '.$owner->name,
                                    'payment_id' => $payment->id,
                                ]);

                                DB::table('affiliate_commission_histories')->insert([
                                    'company_id' => $owner->id,
                                    'payment_id' => $payment->id,
                                    'recipient_id' => $maUser->id,
                                    'tier' => 'master_affiliate',
                                    'base_amount' => $commissionBasePrice,
                                    'commission_rate' => $maCommissionRate,
                                    'commission_amount' => $maCommissionAmount,
                                    'status' => 'paid',
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);

                                $title = "Langganan Berhasil: {$owner->name}";
                                $message = "Agen {$owner->name} dari jaringan Anda telah membayar paket langganan. Komisi Master Affiliate telah ditambahkan ke dalam dompet Anda.";
                                $maUser->notify(new NewReferralNotification($title, $message));
                            }

                            if ($maProfile && $maProfile->upline_id) {
                                $partnerUser = User::find($maProfile->upline_id);
                                if ($partnerUser) {
                                    $partnerCommissionRate = isset($adminConfig['partner_commission']) ? (float) $adminConfig['partner_commission'] : 0;
                                    // Gunakan Harga Dasar Komisi yang sudah dikurangi PPN
                                    $partnerCommissionAmount = ($commissionBasePrice * $partnerCommissionRate) / 100;

                                    if ($partnerCommissionAmount > 0) {
                                        $partnerUser->wallet->deposit($partnerCommissionAmount, [
                                            'type' => 'commission',
                                            'description' => 'Partner Subscription commission from Agent '.$owner->name,
                                            'payment_id' => $payment->id,
                                        ]);

                                        DB::table('affiliate_commission_histories')->insert([
                                            'company_id' => $owner->id,
                                            'payment_id' => $payment->id,
                                            'recipient_id' => $partnerUser->id,
                                            'tier' => 'partner',
                                            'base_amount' => $commissionBasePrice,
                                            'commission_rate' => $partnerCommissionRate,
                                            'commission_amount' => $partnerCommissionAmount,
                                            'status' => 'paid',
                                            'created_at' => now(),
                                            'updated_at' => now(),
                                        ]);

                                        $title = "Langganan Berhasil: {$owner->name}";
                                        $message = "Agen {$owner->name} dari jaringan Anda telah membayar paket langganan. Komisi Partner telah ditambahkan ke dalam dompet Anda.";
                                        $partnerUser->notify(new NewReferralNotification($title, $message));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private function getAgentSubscriptionPackage(Payment $payment): ?AgentSubscriptionPackage
    {
        $payment->load('payable');
        $payable = $payment->payable;

        if (! $payable) {
            Log::error('Payable not found', ['payment_id' => $payment->id]);

            return null;
        }

        $package = AgentSubscriptionPackage::find($payable->package_id);

        if (! $package) {
            Log::error('Package not found', ['payment_id' => $payment->id]);
        }

        return $package;
    }

    private function createNewSubscription(Company $owner, AgentSubscriptionPackage $package): void
    {
        $owner->agentSubscription()->create([
            'package_id' => $package->id,
            'started_at' => now(),
            'ended_at' => now()->addMonths($package->duration_months),
        ]);
    }

    private function renewSubscription($existingSubscription, AgentSubscriptionPackage $package): void
    {
        $newEndDate = $existingSubscription->status === AgentSubscriptionStatus::ACTIVE
          ? $existingSubscription->ended_at->addMonths($package->duration_months)
          : now()->addMonths($package->duration_months);

        $existingSubscription->update([
            'package_id' => $package->id,
            'started_at' => now(),
            'ended_at' => $newEndDate,
        ]);
    }

    private function processAiCreditTopup(Payment $payment): void
    {
        Log::info('Processing AI credit topup', ['payment_id' => $payment->id]);

        $owner = $payment->owner;
        if (! $owner) {
            Log::error('Owner not found', ['payment_id' => $payment->id]);

            return;
        }
        $payment->load('payable');
        if (! $payment->payable) {
            Log::error('Payable not found', ['payment_id' => $payment->id]);
        }
        $aiCredit = $owner->aiCredit()->first();
        if (! $aiCredit) {
            $owner->aiCredit()->create([
                'balance' => $payment->payable->amount,
            ]);
        } else {
            $aiCredit->increment('balance', $payment->payable->amount);
        }
    }

    private function processWalletTopup(Payment $payment): void
    {
        Log::info('Processing wallet topup', ['payment_id' => $payment->id]);

        $owner = $payment->owner;
        if (! $owner) {
            Log::error('Owner not found', ['payment_id' => $payment->id]);

            return;
        }

        $payment->load('payable');
        $topup = $payment->payable;

        $owner->wallet->deposit($topup->amount, [
            'type' => 'topup',
            'description' => 'Wallet topup via Midtrans',
            'payment_id' => $payment->id,
        ]);

        Log::info('Wallet topup successful', [
            'owner_id' => $payment->owner_id,
            'wallet_id' => $owner->wallet->id,
            'amount' => $topup->amount,
        ]);
    }

    private function logUnknownPayableType(Payment $payment): void
    {
        Log::warning('Unknown payable type', [
            'payment_id' => $payment->id,
            'payable_type' => $payment->payable_type,
        ]);
    }
}
