<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\StoreRoleRequest;
use App\Http\Requests\Companies\UpdateRoleRequest;
use App\Models\Company;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Support\Arr;
use Inertia\Inertia;

class RoleController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function index(Company $company)
  {
    // Retrieve all permissions
    $permissions = Permission::all();

    // Get roles associated with the company
    $roles = Role::where('name', 'like', "company:{$company->id}:%")
      ->with(['permissions', 'users']) // Eager load permissions and users
      ->get();

    return Inertia::render('companies/dashboard/roles/index', [
      'company' => $company,
      'roles' => $roles,
      'permissions' => $permissions,
    ]);
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(StoreRoleRequest $request, Company $company)
  {
    $validated = $request->validated();

    // Filter out empty permissions
    $permissions = Arr::where($validated['permissions'] ?? [], fn($v) => $v);

    // Prefix role name with company ID
    $validated['name'] = "company:{$company->id}:{$validated['name']}";

    // Create the role and sync permissions
    $role = Role::create($validated);
    $role->syncPermissions(array_keys($permissions));

    return back();
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(UpdateRoleRequest $request, Company $company, Role $role)
  {
    $validated = $request->validated();

    // Filter out empty permissions
    $permissions = Arr::where($validated['permissions'] ?? [], fn($v) => $v);

    // Update role name if provided
    if (isset($validated['name'])) {
      $validated['name'] = "company:{$company->id}:{$validated['name']}";
    }

    // Update role and sync permissions if provided
    $role->update($validated);
    if (isset($validated['permissions'])) {
      $role->syncPermissions(array_keys($permissions));
    }

    return back();
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(Company $company, Role $role)
  {
    // Delete the role
    $role->delete();

    return back();
  }
}
