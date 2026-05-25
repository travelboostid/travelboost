<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\InviteCompanyTeamRequest;
use App\Http\Requests\UpdateCompanyTeamRequest;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Role;
use App\Models\User;
use App\Notifications\TeamAccountNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function index(Company $company): Response
    {
        $members = $company->teams()
            ->with(['user.roles'])
            ->orderByDesc('is_owner')
            ->orderBy('id')
            ->get();

        $roles = Role::query()
            ->where('name', 'like', "company:{$company->id}:%")
            ->orderBy('display_name')
            ->get();

        $currentMember = $company->teams()
            ->where('user_id', auth()->id())
            ->first();

        return Inertia::render('companies/dashboard/teams/index', [
            'members' => $members,
            'roles' => $roles,
            'canManageMembers' => (bool) $currentMember?->is_owner,
        ]);
    }

    public function invite(InviteCompanyTeamRequest $request, Company $company): RedirectResponse
    {
        $this->ensureOwnerAccess($company);

        $validated = $request->validated();
        $plainPassword = $validated['password'];

        $team = DB::transaction(function () use ($company, $validated) {
            $user = User::create([
                'company_id' => null,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'email_verified_at' => now(),
                'username' => $validated['username'],
                'password' => $validated['password'],
                'status' => UserStatus::ACTIVE,
            ]);

            $roleName = $validated['role'];
            $baseUserRole = $company->type === CompanyType::AGENT
              ? 'user:agent'
              : 'user:vendor';

            $user->addRoles([$baseUserRole, $roleName]);

            return $company->teams()->create([
                'user_id' => $user->id,
                'invite_email' => $user->email,
                'invite_role' => $roleName,
                'invite_token' => Str::uuid()->toString(),
                'invited_at' => now(),
                'accepted_at' => now(),
                'status' => CompanyTeamStatus::ACTIVE,
            ]);
        });

        $team->load('user');

        $this->sendNotification(
            $company,
            $team->user->email,
            'Your TravelBoost team account is ready',
            'Your team account has been created',
            'A company owner has created your TravelBoost team account. You can sign in immediately with the details below.',
            [
                ['label' => 'Company', 'value' => $company->name],
                ['label' => 'Name', 'value' => $team->user->name],
                ['label' => 'Email', 'value' => $team->user->email],
                ['label' => 'Username', 'value' => $team->user->username],
                ['label' => 'Role', 'value' => $this->formatRoleName($team->invite_role)],
                ['label' => 'Status', 'value' => 'Active'],
                ['label' => 'Password', 'value' => $plainPassword],
            ],
            'For security, please sign in and change your password after your first login.'
        );

        return back()->with('success', 'Team member added successfully.');
    }

    public function resendInvitation(Company $company, CompanyTeam $team): RedirectResponse
    {
        abort(404);
    }

    public function update(UpdateCompanyTeamRequest $request, Company $company, CompanyTeam $team): RedirectResponse
    {
        $this->ensureOwnerAccess($company);
        $team = $this->ensureTeamBelongsToCompany($company, $team);

        if ($team->is_owner) {
            return back()->withErrors(['team' => 'The owner account cannot be changed here.']);
        }

        if (! $team->user) {
            return back()->withErrors(['team' => 'This team record is not linked to a user account.']);
        }

        $validated = $request->validated();
        $originalRole = $team->invite_role;
        $originalStatus = $team->status?->value ?? $team->status;
        $originalEmail = $team->user->email;
        $passwordChanged = array_key_exists('password', $validated);
        $plainPassword = $validated['password'] ?? null;

        DB::transaction(function () use ($company, $team, $validated): void {
            if (array_key_exists('role', $validated) && $validated['role'] !== $team->invite_role) {
                $existingRoles = $team->user->roles()
                    ->where('name', 'like', "company:{$company->id}:%")
                    ->pluck('name')
                    ->all();

                if ($existingRoles !== []) {
                    $team->user->removeRoles($existingRoles, "company:{$company->id}");
                }

                $team->user->addRole($validated['role'], "company:{$company->id}");
                $team->invite_role = $validated['role'];
            }

            if (array_key_exists('status', $validated)) {
                $team->status = $validated['status'];
            }

            if (array_key_exists('email', $validated) && $validated['email'] !== $team->user->email) {
                $team->user->email = $validated['email'];
                $team->invite_email = $validated['email'];
            }

            if (array_key_exists('password', $validated)) {
                $team->user->password = $validated['password'];
            }

            if ($team->user->isDirty()) {
                $team->user->save();
            }

            if ($team->isDirty()) {
                $team->save();
            }
        });

        $team->refresh();
        $team->load('user');

        $details = [];
        $subject = 'Your TravelBoost team account has been updated';
        $headline = 'Your team account details have changed';
        $intro = 'A company owner updated your TravelBoost team account. Please review the latest information below.';
        $closing = null;

        if (array_key_exists('role', $validated) && $validated['role'] !== $originalRole) {
            $details[] = ['label' => 'Previous Role', 'value' => $this->formatRoleName($originalRole)];
            $details[] = ['label' => 'New Role', 'value' => $this->formatRoleName($team->invite_role)];
        }

        if (array_key_exists('status', $validated) && $validated['status'] !== $originalStatus) {
            $details[] = ['label' => 'Previous Status', 'value' => ucfirst($originalStatus)];
            $details[] = ['label' => 'New Status', 'value' => ucfirst($team->status->value)];
        }

        if (array_key_exists('email', $validated) && $validated['email'] !== $originalEmail) {
            $details[] = ['label' => 'Previous Email', 'value' => $originalEmail];
            $details[] = ['label' => 'New Email', 'value' => $team->user->email];
        }

        if ($passwordChanged && $plainPassword) {
            $details[] = ['label' => 'Password', 'value' => $plainPassword];
            $closing = 'For security, please sign in and change your password as soon as possible.';
        }

        if ($details !== []) {
            $this->sendNotification(
                $company,
                $team->user->email,
                $subject,
                $headline,
                $intro,
                $details,
                $closing
            );
        }

        return back()->with('success', 'Team member updated successfully.');
    }

    public function destroy(Company $company, CompanyTeam $team): RedirectResponse
    {
        $this->ensureOwnerAccess($company);
        $team = $this->ensureTeamBelongsToCompany($company, $team);

        if ($team->is_owner) {
            return back()->withErrors(['team' => 'The owner account cannot be deleted.']);
        }

        DB::transaction(function () use ($company, $team): void {
            if ($team->user) {
                $existingRoles = $team->user->roles()
                    ->where('name', 'like', "company:{$company->id}:%")
                    ->pluck('name')
                    ->all();

                if ($existingRoles !== []) {
                    $team->user->removeRoles($existingRoles, "company:{$company->id}");
                }
            }

            $user = $team->user;
            $team->delete();

            if ($user && ! $user->companies()->exists()) {
                $user->status = UserStatus::INACTIVE;
                $user->save();
            }
        });

        return back()->with('success', 'Team member deleted successfully.');
    }

    private function ensureOwnerAccess(Company $company): void
    {
        $currentMember = $company->teams()
            ->where('user_id', auth()->id())
            ->first();

        abort_unless($currentMember?->is_owner, 403);
    }

    private function ensureTeamBelongsToCompany(Company $company, CompanyTeam $team): CompanyTeam
    {
        abort_unless($team->company_id === $company->id, 404);

        return $team;
    }

    private function sendNotification(
        Company $company,
        string $email,
        string $subject,
        string $headline,
        string $intro,
        array $details,
        ?string $closing = null,
    ): void {
        Notification::route('mail', $email)->notify(
            new TeamAccountNotification($company, $subject, $headline, $intro, $details, $closing)
        );
    }

    private function formatRoleName(?string $roleName): string
    {
        if (! $roleName) {
            return '-';
        }

        $roleSegment = str($roleName)->afterLast(':')->replace('-', ' ');

        return $roleSegment->title()->toString();
    }
}
