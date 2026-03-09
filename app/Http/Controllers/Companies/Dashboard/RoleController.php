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
    $permissions = Permission::all();
    $roles = Role::where('name', 'like', "company:{$company->id}:%")
      ->with(['permissions', 'users'])
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
    $permissions = Arr::where($validated['permissions'] ?? [], fn($v) => $v);
    $validated['name'] = "company:{$company->id}:{$validated['name']}";
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
    $permissions = Arr::where($validated['permissions'] ?? [], fn($v) => $v);

    if (isset($validated['name'])) {
      $validated['name'] = "company:{$company->id}:{$validated['name']}";
    }
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
    $role->delete();
    return back();
  }
}
