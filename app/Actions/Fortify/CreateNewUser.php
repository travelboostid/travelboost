<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\CompanyTeamStatus;
use App\Enums\UserStatus;
use App\Models\User;
use App\Models\AffiliateProfile;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Domain;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
  use PasswordValidationRules, ProfileValidationRules;

  private readonly ?Domain $domain;
  private readonly array $intentValidationRules;
  private readonly array $registerAsAgentValidatorRules;
  private readonly array $registerAsCustomerValidatorRules;
  private readonly array $registerAsTeamValidatorRules;

  public function __construct()
  {
    $this->domain = Context::get('domain');
    if ($this->domain) {
      $this->domain->load(['owner']);
    }
    $this->intentValidationRules = [
      'intent' => ['required', 'string', 'in:register-as-customer,register-as-agent,register-as-team'],
    ];
    $this->registerAsAgentValidatorRules = [
      ...$this->profileRules(),
      'password' => $this->passwordRules(),
    ];
    $this->registerAsCustomerValidatorRules = [
      ...$this->profileRules(),
      'password' => $this->passwordRules(),
    ];
    $this->registerAsTeamValidatorRules = [
      ...$this->profileRules(),
      'invite_token' => ['required', 'string', 'exists:company_teams,invite_token'],
      'password' => $this->passwordRules(),
    ];
  }


  public function create(array $input): User
  {
    $validated = Validator::validate($input, $this->intentValidationRules);
    return match ($validated['intent']) {
      'register-as-customer' => $this->processRegisterAsCustomer($input),
      'register-as-agent' => $this->processRegisterAsAgent($input),
      'register-as-team' => $this->processRegisterAsTeam($input),
      default => null,
    };
  }

  private function processRegisterAsAgent(array $input)
  {
    if ($this->domain && $this->domain->owner instanceof Company) {
      return null;
    }

    $validated = Validator::validate($input, $this->registerAsAgentValidatorRules);
    $validated = $this->fillAffiliateDataIfProvided($validated);

    $validated['company_id'] = null;
    $user = User::create($validated);

    return $user;
  }

  private function processRegisterAsCustomer(array $input)
  {
    if (!$this->domain) {
      return null;
    }
    if (!$this->domain->owner instanceof Company) {
      return null;
    }
    $validated = Validator::validate($input, $this->registerAsCustomerValidatorRules);
    $validated = $this->fillAffiliateDataIfProvided($validated);

    $validated['company_id'] = $this->domain->owner->id;
    $validated['status'] = UserStatus::ACTIVE;

    $user = User::create($validated);

    return $user;
  }

  private function processRegisterAsTeam(array $input)
  {
    if ($this->domain && $this->domain->owner instanceof Company) {
      return null;
    }

    $validated = Validator::validate($input, $this->registerAsTeamValidatorRules);

    $validated['company_id'] = null;
    $validated['status'] = UserStatus::ACTIVE;

    $team = CompanyTeam::where('invite_token', $validated['invite_token'])->first();
    if (!$team) {
      return null;
    }

    $validated['email'] = $team->invite_email;

    $user = User::create($validated);
    $team->update([
      'user_id' => $user->id,
      'status' => CompanyTeamStatus::ACTIVE,
    ]);
    $user->addRole($team->invite_role, "company:{$team->company_id}");

    CompanyTeam::where('invite_email', $user->email)
      ->where('status', CompanyTeamStatus::PENDING)
      ->where('id', '!=', $team->id)
      ->update(['status' => CompanyTeamStatus::REJECTED]);
    return $user;
  }

  private function fillAffiliateDataIfProvided(array $input)
  {
    if (empty($input['referral_code'])) {
      return $input;
    }
    $affiliate = AffiliateProfile::where('referral_code', $input['referral_code'])->first();
    if (!$affiliate) {
      return $input;
    }

    $input['referred_by'] = $affiliate->user_id;
    if ($affiliate->level === 'partner') {
      $input['partner_id'] = $affiliate->user_id;
    } elseif ($affiliate->level === 'master') {
      $input['master_affiliate_id'] = $affiliate->user_id;
      $input['partner_id'] = $affiliate->parent_id;
    } elseif ($affiliate->level === 'affiliate') {
      $input['master_affiliate_id'] = $affiliate->parent_id;
      $master = AffiliateProfile::where('user_id', $affiliate->parent_id)->first();
      $input['partner_id'] = $master ? $master->parent_id : null;
    }

    return $input;
  }
}
