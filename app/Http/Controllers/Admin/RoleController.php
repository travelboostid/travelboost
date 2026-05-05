<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CompanyType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexAgentRequest;
use App\Http\Requests\Admin\StoreRoleRequest;
use App\Http\Requests\Admin\UpdateRoleRequest;
use App\Models\Company;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function index(IndexAgentRequest $request)
  {
    $validated = $request->validated();
    $data = Role::query()
      ->when($validated['name'] ?? null, function ($query, $name) {
        $query->where('name', 'like', "%$name%");
      })
      ->paginate();

    return Inertia::render('admin/database/roles/index', [
      'data' => $data,
    ]);
  }

  /**
   * Show the form for creating a new resource.
   */
  public function create()
  {
    //
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(StoreRoleRequest $request)
  {
    $validated = $request->validated();
    Role::create($validated);
    return redirect()->back()->with('success', 'Role created successfully');
  }

  /**
   * Display the specified resource.
   */
  public function show(string $id)
  {
    //
  }

  /**
   * Show the form for editing the specified resource.
   */
  public function edit(string $id)
  {
    //
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(UpdateRoleRequest $request, Role $role)
  {
    $validated = $request->validated();
    $role->update($validated);
    return redirect()->back()->with('success', 'Role updated successfully');
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(Role $role)
  {
    $role->delete();
    return redirect()->back()->with('success', 'Role deleted successfully');
  }
}
