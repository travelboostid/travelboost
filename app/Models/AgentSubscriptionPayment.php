<?php

namespace App\Models;

use App\Notifications\CommissionReceivedNotification;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AgentSubscriptionPayment extends Model
{
    protected $fillable = ['package_id'];

    public function payment()
    {
        return $this->morphOne(Payment::class, 'payable');
    }

    public function package()
    {
        return $this->belongsTo(AgentSubscriptionPackage::class, 'package_id');
    }

    public function onPaid(Payment $payment)
    {
        DB::transaction(function () use ($payment) {
            $company = Company::find($payment->owner_id);
            if (! $company) {
                return;
            }

            $package = $this->package;
            if (! $package) {
                return;
            }

            $subscription = AgentSubscription::with('package')->where('company_id', $company->id)->latest()->first();
            $now = Carbon::now();

            $isPreviousFreeTrial = $subscription && $subscription->package && $subscription->package->price <= 0;

            if ($subscription && $subscription->ended_at && $subscription->ended_at > $now && ! $isPreviousFreeTrial) {
                $subscription->update([
                    'package_id' => $package->id,
                    'ended_at' => Carbon::parse($subscription->ended_at)->addMonths($package->duration_months),
                ]);
            } else {
                AgentSubscription::create([
                    'company_id' => $company->id,
                    'package_id' => $package->id,
                    'started_at' => $now,
                    'ended_at' => clone $now->addMonths($package->duration_months),
                ]);
            }

            Domain::where('owner_type', Company::class)
                ->where('owner_id', $company->id)
                ->update(['domain_enabled' => true]);

            $appConfig = AppConfig::where('key', 'admin')->first();
            $adminConfig = $appConfig ? $appConfig->value : [];
            $freeAiAfterSub = isset($adminConfig['free_ai_after_subscription']) ? (float) $adminConfig['free_ai_after_subscription'] : 0;

            if ($freeAiAfterSub > 0) {
                $aiCredit = $company->aiCredit()->first();
                if ($aiCredit) {
                    $aiCredit->increment('balance', $freeAiAfterSub);
                } else {
                    $company->aiCredit()->create([
                        'balance' => $freeAiAfterSub,
                    ]);
                }
            }

            if ($company->referred_by && Schema::hasTable('parameter_travelboosts')) {
                $baseAmount = $payment->amount - ($payment->amount * 0.11);

                $affiliateRate = DB::table('parameter_travelboosts')
                    ->where('category', 'affiliate')
                    ->where('param_key', 'affiliate_commission')
                    ->value('number_value') ?? 0;

                $maRate = DB::table('parameter_travelboosts')
                    ->where('category', 'affiliate')
                    ->where('param_key', 'ma_commission')
                    ->value('number_value') ?? 0;

                $partnerRate = DB::table('parameter_travelboosts')
                    ->where('category', 'affiliate')
                    ->where('param_key', 'partner_commission')
                    ->value('number_value') ?? 0;

                $rates = [
                    'affiliate' => $affiliateRate,
                    'master_affiliate' => $maRate,
                    'partner' => $partnerRate,
                ];

                $currentUplineId = $company->referred_by;

                while ($currentUplineId) {
                    $profile = AffiliateProfile::where('user_id', $currentUplineId)->first();

                    if (! $profile || $profile->status !== 'approved') {
                        break;
                    }

                    $tier = $profile->tier;
                    $rate = $rates[$tier] ?? 0;

                    if ($rate > 0) {
                        $commissionAmount = $baseAmount * ($rate / 100);

                        DB::table('affiliate_commission_histories')->insert([
                            'company_id' => $company->id,
                            'payment_id' => $payment->id,
                            'recipient_id' => $profile->user_id,
                            'tier' => $tier,
                            'base_amount' => $baseAmount,
                            'commission_rate' => $rate,
                            'commission_amount' => $commissionAmount,
                            'status' => 'paid',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        $user = User::find($profile->user_id);
                        if ($user) {
                            $user->depositFloat($commissionAmount, ['description' => 'Agent Subscription Commission']);
                            $user->notify(new CommissionReceivedNotification($company->name, $commissionAmount, $tier));
                        }
                    }

                    $currentUplineId = $profile->upline_id;
                }
            }
        });
    }
}
