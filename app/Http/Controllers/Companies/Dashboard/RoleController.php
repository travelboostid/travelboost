<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\IndexCompanyRoleRequest;
use App\Http\Requests\Companies\StoreRoleRequest;
use App\Http\Requests\Companies\UpdateRoleRequest;
use App\Models\Company;
use App\Models\Permission;
use App\Models\Role;
use App\Support\CompanyPermissionMap;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function index(Company $company, IndexCompanyRoleRequest $request): Response
    {
        abort_unless(
            CompanyPermissionMap::userHasScopedPermission(
                $request->user(),
                $company,
                'settings.query',
            ),
            403
        );

        $validated = $request->validated();

        $companyUsablePermissions = CompanyPermissionMap::userFacingPermissionsForCompany($company);
        $permissions = Permission::query()
            ->whereIn('name', $companyUsablePermissions)
            ->orderBy('name')
            ->get();

        $roles = $this->filteredRolesQuery($company, $validated)
            ->paginate($validated['per_page'] ?? 10)
            ->through(function (Role $role) use ($company): Role {
                $role->setRelation('permissions', $role->permissions->filter(
                    fn (Permission $permission): bool => in_array(
                        $permission->name,
                        CompanyPermissionMap::userFacingPermissionsForCompany($company),
                        true,
                    ),
                )->values());

                return $role;
            })
            ->withQueryString();

        return Inertia::render('companies/dashboard/roles/index', [
            'data' => $roles,
            'permissions' => $permissions->values()->all(),
        ]);
    }

    public function store(StoreRoleRequest $request, Company $company): RedirectResponse
    {
        abort_unless(
            CompanyPermissionMap::userHasScopedPermission(
                $request->user(),
                $company,
                'settings.mutation',
            ),
            403
        );

        $validated = $request->validated();

        $permissions = Arr::where($validated['permissions'] ?? [], fn ($v) => $v);
        $selectedPermissions = CompanyPermissionMap::visibleSelection(array_keys($permissions), $company);
        $syncedPermissions = CompanyPermissionMap::expand($selectedPermissions);

        $validated['name'] = "company:{$company->id}:{$validated['name']}";

        $role = Role::create($validated);
        $role->syncPermissions($syncedPermissions);

        return back()->with('success', 'Role created successfully.');
    }

    public function update(UpdateRoleRequest $request, Company $company, Role $role): RedirectResponse
    {
        abort_unless(
            CompanyPermissionMap::userHasScopedPermission(
                $request->user(),
                $company,
                'settings.mutation',
            ),
            403
        );

        $role = $this->ensureRoleBelongsToCompany($company, $role);

        if ($this->isProtectedRole($role)) {
            return back()->withErrors(['role' => 'The superadmin role cannot be modified.']);
        }

        $validated = $request->validated();

        $permissions = Arr::where($validated['permissions'] ?? [], fn ($v) => $v);
        $selectedPermissions = CompanyPermissionMap::visibleSelection(array_keys($permissions), $company);
        $syncedPermissions = CompanyPermissionMap::expand($selectedPermissions);

        if (isset($validated['permissions']) && $request->user()->roles->contains('id', $role->id)) {
            if (! in_array('settings.query', $selectedPermissions, true) || ! in_array('settings.mutation', $selectedPermissions, true)) {
                return back()->withErrors(['permissions' => 'You cannot remove View Settings or Manage Settings from your own role.']);
            }
        }

        if (isset($validated['name'])) {
            $validated['name'] = "company:{$company->id}:{$validated['name']}";
        }

        $role->update($validated);

        if (isset($validated['permissions'])) {
            $role->syncPermissions($syncedPermissions);
        }

        return back()->with('success', 'Role updated successfully.');
    }

    public function destroy(Request $request, Company $company, Role $role): RedirectResponse
    {
        abort_unless(
            CompanyPermissionMap::userHasScopedPermission(
                $request->user(),
                $company,
                'settings.mutation',
            ),
            403
        );

        $role = $this->ensureRoleBelongsToCompany($company, $role);

        if ($this->isProtectedRole($role)) {
            return back()->withErrors(['role' => 'The superadmin role cannot be deleted.']);
        }

        if ($request->user()->roles->contains('id', $role->id)) {
            return back()->withErrors(['role' => 'You cannot delete a role assigned to yourself.']);
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
