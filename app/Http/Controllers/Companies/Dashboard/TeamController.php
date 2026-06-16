<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\BulkDestroyCompanyTeamRequest;
use App\Http\Requests\Companies\BulkUpdateCompanyTeamRequest;
use App\Http\Requests\Companies\IndexCompanyTeamRequest;
use App\Http\Requests\Companies\InviteCompanyTeamRequest;
use App\Http\Requests\UpdateCompanyTeamRequest;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Role;
use App\Models\User;
use App\Notifications\TeamAccountNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class TeamController extends Controller
{
    public function index(Company $company, IndexCompanyTeamRequest $request): Response
    {
        $validated = $request->validated();

        $members = $this->filteredTeamsQuery($company, $validated)
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        $roles = Role::query()
            ->where('name', 'like', "company:{$company->id}:%")
            ->orderBy('display_name')
            ->get();

        $currentMember = $company->teams()
            ->where('user_id', auth()->id())
            ->first();

        return Inertia::render('companies/dashboard/teams/index', [
            'data' => $members,
            'roles' => $roles,
            'canManageMembers' => (bool) $currentMember?->is_owner,
        ]);
    }

    public function bulkUpdate(
        BulkUpdateCompanyTeamRequest $request,
        Company $company,
    ): RedirectResponse {
        $this->ensureOwnerAccess($company);

        $validated = $request->validated();
        $status = CompanyTeamStatus::from($validated['status']);

        $teams = CompanyTeam::query()
            ->where('company_id', $company->id)
            ->whereIn('id', $validated['ids'])
            ->where('is_owner', false)
            ->with('user')
            ->get();

        DB::transaction(function () use ($teams, $status): void {
            foreach ($teams as $team) {
                if (! $team->user) {
                    continue;
                }

                $team->status = $status;
                $team->save();
            }
        });

        return back()->with('success', 'Selected team members updated successfully.');
    }

    public function bulkDestroy(
        BulkDestroyCompanyTeamRequest $request,
        Company $company,
    ): RedirectResponse {
        $this->ensureOwnerAccess($company);

        $teams = CompanyTeam::query()
            ->where('company_id', $company->id)
            ->whereIn('id', $request->validated('ids'))
            ->where('is_owner', false)
            ->with('user')
            ->get();

        DB::transaction(function () use ($company, $teams): void {
            foreach ($teams as $team) {
                $this->removeTeamMember($company, $team);
            }
        });

        return back()->with('success', 'Selected team members removed successfully.');
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
            $this->removeTeamMember($company, $team);
        });

        return back()->with('success', 'Team member deleted successfully.');
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function filteredTeamsQuery(Company $company, array $validated): Builder
    {
        return CompanyTeam::query()
            ->where('company_id', $company->id)
            ->with(['user.roles'])
            ->when($validated['user'] ?? null, function (Builder $query, string $term): void {
                $query->where(function (Builder $inner) use ($term): void {
                    $inner->where('invite_email', 'ilike', '%'.$term.'%')
                        ->orWhereHas('user', function (Builder $userQuery) use ($term): void {
                            $userQuery->where('name', 'ilike', '%'.$term.'%')
                                ->orWhere('email', 'ilike', '%'.$term.'%');
                        });
                });
            })
            ->when($validated['username'] ?? null, function (Builder $query, string $username): void {
                $query->whereHas('user', function (Builder $userQuery) use ($username): void {
                    $userQuery->where('username', 'ilike', '%'.$username.'%');
                });
            })
            ->when($validated['role'] ?? null, function (Builder $query, array $roles): void {
                $query->whereIn('invite_role', $roles);
            })
            ->when($validated['status'] ?? null, function (Builder $query, array $statuses): void {
                $query->whereIn('status', $statuses);
            })
            ->when($validated['invited_at'] ?? null, function (Builder $query, string $invitedAt): void {
                $range = explode(',', $invitedAt);

                if (count($range) === 2) {
                    $from = Carbon::createFromTimestamp((int) $range[0] / 1000);
                    $to = Carbon::createFromTimestamp((int) $range[1] / 1000);
                    $query->whereBetween('invited_at', [$from, $to]);

                    return;
                }

                $date = Carbon::createFromTimestamp((int) $range[0] / 1000);
                $query->whereDate('invited_at', $date);
            })
            ->when($validated['sort'] ?? '-invited_at', function (Builder $query, string $sort): void {
                $needsUserJoin = collect(explode(',', $sort))
                    ->map(fn (string $item) => ltrim($item, '-'))
                    ->contains(fn (string $field) => in_array($field, ['user', 'username'], true));

                if ($needsUserJoin) {
                    $query->leftJoin(
                        'users as team_member_users',
                        'company_teams.user_id',
                        '=',
                        'team_member_users.id',
                    );
                }

                foreach (explode(',', $sort) as $item) {
                    $direction = str_starts_with($item, '-') ? 'desc' : 'asc';
                    $field = ltrim($item, '-');

                    match ($field) {
                        'user' => $query->orderByRaw(
                            "COALESCE(team_member_users.name, company_teams.invite_email) {$direction}"
                        ),
                        'username' => $query->orderBy('team_member_users.username', $direction),
                        'role' => $query->orderBy('invite_role', $direction),
                        'status' => $query->orderBy('status', $direction),
                        'invited_at' => $query->orderBy('invited_at', $direction),
                        'id' => $query->orderBy('company_teams.id', $direction),
                        default => null,
                    };
                }

                $query->select('company_teams.*');
            })
            ->orderByDesc('is_owner');
    }

    private function removeTeamMember(Company $company, CompanyTeam $team): void
    {
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
            if (method_exists($user, 'bankAccounts')) {
                $user->bankAccounts()->delete();
            }
            if (method_exists($user, 'wallets')) {
                $user->wallets()->delete();
            }
            if (method_exists($user, 'affiliateProfile') && $user->affiliateProfile) {
                $user->affiliateProfile->delete();
            }
            if (method_exists($user, 'medias')) {
                $user->medias()->delete();
            }
            if (method_exists($user, 'savedPassengers')) {
                $user->savedPassengers()->delete();
            }
            if (method_exists($user, 'affiliateCommissionRates')) {
                $user->affiliateCommissionRates()->delete();
            }
            if (method_exists($user, 'tourLikes')) {
                $user->tourLikes()->delete();
            }
            if (method_exists($user, 'syncRoles')) {
                $user->syncRoles([]);
            }
            if (method_exists($user, 'syncPermissions')) {
                $user->syncPermissions([]);
            }

            $user->delete();
        }
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
        try {
            Notification::route('mail', $email)->notify(
                new TeamAccountNotification($company, $subject, $headline, $intro, $details, $closing)
            );
        } catch (Throwable $exception) {
            Log::warning('Unable to send team account notification.', [
                'company_id' => $company->id,
                'email' => $email,
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);
        }
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
