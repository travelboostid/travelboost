<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\UserStatus;
use App\Models\User;
use App\Models\AffiliateProfile;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
  use PasswordValidationRules, ProfileValidationRules;

  public function create(array $input): User
  {
    $tenant = request()->attributes->get('tenant');

    // [MODIFIKASI]: Tambahkan validasi referral_code opsional
    Validator::make($input, [
      ...$this->profileRules(),
      'password' => $this->passwordRules(),
      'referral_code' => ['nullable', 'string', 'exists:affiliate_profiles,referral_code'],
    ])->validate();

    $data = collect($input)->only([
      'name',
      'email',
      'username',
      'phone',
      'address',
    ])->toArray();

    // [BARU]: Logika Pelacakan Hierarki Afiliasi
    if (!empty($input['referral_code'])) {
      $affiliate = AffiliateProfile::where('referral_code', $input['referral_code'])->first();

      if ($affiliate) {
        $data['referred_by'] = $affiliate->user_id;

        // Tentukan garis keturunan (Partner -> Master -> Affiliate)
        if ($affiliate->level === 'partner') {
          $data['partner_id'] = $affiliate->user_id;
        } elseif ($affiliate->level === 'master') {
          $data['master_affiliate_id'] = $affiliate->user_id;
          $data['partner_id'] = $affiliate->parent_id;
        } elseif ($affiliate->level === 'affiliate') {
          $data['master_affiliate_id'] = $affiliate->parent_id;

          // Cari Partner dari Master-nya
          $master = AffiliateProfile::where('user_id', $affiliate->parent_id)->first();
          $data['partner_id'] = $master ? $master->parent_id : null;
        }
      }
    }

    $data['company_id'] = $tenant == null ? null : $tenant->id;
    $data['status'] = $tenant == null ? UserStatus::INACTIVE : UserStatus::ACTIVE;
    $data['password'] = $input['password']; // Asumsi Hash dilakukan di Model/Observer atau biarkan Hash::make jika sebelumnya error

    $user = User::create($data);

    return $user;
  }
}
