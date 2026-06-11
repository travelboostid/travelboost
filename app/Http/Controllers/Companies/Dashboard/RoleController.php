<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\IndexCompanyRoleRequest;
use App\Http\Requests\Companies\StoreRoleRequest;
use App\Http\Requests\Companies\UpdateRoleRequest;
use App\Models\Company;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function index(Company $company, IndexCompanyRoleRequest $request): Response
    {
        $validated = $request->validated();

        $companyUsablePermissions = config('travelboost.company_usable_permissions');
        $permissions = Permission::query()
            ->whereIn('name', $companyUsablePermissions)
            ->orderBy('name')
            ->get();

        $roles = $this->filteredRolesQuery($company, $validated)
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        return Inertia::render('companies/dashboard/roles/index', [
            'data' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(StoreRoleRequest $request, Company $company): RedirectResponse
    {
        $validated = $request->validated();

        $permissions = Arr::where($validated['permissions'] ?? [], fn ($v) => $v);

        $validated['name'] = "company:{$company->id}:{$validated['name']}";

        $role = Role::create($validated);
        $role->syncPermissions(array_keys($permissions));

        return back()->with('success', 'Role created successfully.');
    }

    public function update(UpdateRoleRequest $request, Company $company, Role $role): RedirectResponse
    {
        $role = $this->ensureRoleBelongsToCompany($company, $role);

        if ($this->isProtectedRole($role)) {
            return back()->withErrors(['role' => 'The superadmin role cannot be modified.']);
        }

        $validated = $request->validated();

        $permissions = Arr::where($validated['permissions'] ?? [], fn ($v) => $v);

        if (isset($validated['name'])) {
            $validated['name'] = "company:{$company->id}:{$validated['name']}";
        }

        $role->update($validated);

        if (isset($validated['permissions'])) {
            $role->syncPermissions(array_keys($permissions));
        }

        return back()->with('success', 'Role updated successfully.');
    }

    public function destroy(Company $company, Role $role): RedirectResponse
    {
        $role = $this->ensureRoleBelongsToCompany($company, $role);

        if ($this->isProtectedRole($role)) {
            return back()->withErrors(['role' => 'The superadmin role cannot be deleted.']);
        }

        $role->delete();

        return back()->with('success', 'Role deleted successfully.');
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function filteredRolesQuery(Company $company, array $validated): Builder
    {
        return Role::query()
            ->where('name', 'like', "company:{$company->id}:%")
            ->with(['permissions', 'users'])
            ->withCount('users')
            ->when($validated['display_name'] ?? null, function (Builder $query, string $term): void {
                $query->where('display_name', 'ilike', '%'.$term.'%');
            })
            ->when($validated['sort'] ?? 'display_name', function (Builder $query, string $sort): void {
                foreach (explode(',', $sort) as $item) {
                    $direction = str_starts_with($item, '-') ? 'desc' : 'asc';
                    $field = ltrim($item, '-');

                    if (in_array($field, ['id', 'name', 'display_name', 'description'], true)) {
                        $query->orderBy($field, $direction);
                    }
                }
            })
            ->orderByRaw("CASE WHEN name LIKE '%:superadmin' THEN 0 ELSE 1 END");
    }

    private function ensureRoleBelongsToCompany(Company $company, Role $role): Role
    {
        if (! str_starts_with($role->name, "company:{$company->id}:")) {
            abort(404);
        }

        return $role;
    }

    private function isProtectedRole(Role $role): bool
    {
        return str_ends_with($role->name, ':superadmin');
    }
}
