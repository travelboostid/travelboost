<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexUserRequest;
use App\Http\Requests\Admin\BulkUpdateUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use DB;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function index(IndexUserRequest $request)
  {
    $userRoles = Role::whereLike('name', 'user:%')->pluck('name')->toArray();
    $validated = $request->validated();
    $data = User::query()
      ->with(['company'])
      ->when($validated['name'] ?? null, function ($query, $name) {
        $query->where('name', 'ilike', "%$name%");
      })
      ->when($validated['email'] ?? null, function ($query, $email) {
        $query->where('email', 'ilike', "%$email%");
      })
      ->when($validated['username'] ?? null, function ($query, $username) {
        $query->where('username', 'ilike', "%$username%");
      })
      ->when($validated['phone'] ?? null, function ($query, $phone) {
        $query->where('phone', 'ilike', "%$phone%");
      })
      ->when($validated['address'] ?? null, function ($query, $address) {
        $query->where('address', 'ilike', "%$address%");
      })
      ->when($validated['status'] ?? null, function ($query, $status) {
        $query->whereIn('status', $status);
      })
      ->when($validated['company_holder'] ?? null, function ($query, $companyIds) {
        $query->whereIn('company_id', $companyIds);
      })
      ->when($validated['roles'] ?? null, function ($query, $roles) {
        $query->whereHas('roles', function ($q) use ($roles) {
          $q->whereIn('name', $roles);
        });
      })
      ->when($validated['created_at'] ?? null, function ($query, $created_at) {
        $range = explode(',', $created_at);

        if (count($range) === 2) {
          $from = Carbon::createFromTimestamp($range[0] / 1000);
          $to = Carbon::createFromTimestamp($range[1] / 1000);
          $query->whereBetween('created_at', [$from, $to]);
        } else {
          $date = Carbon::createFromTimestamp($range[0] / 1000);
          $query->whereDate('created_at', $date);
        }
      })
      ->when($validated['sort'] ?? null, function ($query, $sort) {
        $sorts = explode(',', $sort);
        foreach ($sorts as $item) {
          $dir = str_starts_with($item, '-') ? 'desc' : 'asc';
          $field = ltrim($item, '-');
          $query->orderBy($field, $dir);
        }
      })
      ->paginate($validated['per_page'] ?? 10);

    return Inertia::render('admin/database/users/index', [
      'data' => $data,
      'userRoles' => $userRoles,
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
  public function store(Request $request)
  {
    //
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
    $user = User::with(['companies', 'roles'])->findOrFail($id);
    return Inertia::render('admin/database/users/edit', [
      'user' => $user,
    ]);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(UpdateUserRequest $request, User $user)
  {
    $validated = $request->validated();
    $user->update($validated);
    return back()->with('success', 'User updated successfully.');
  }

  public function bulkUpdate(BulkUpdateUserRequest $request)
  {
    $validated = $request->validated();
    $users = User::whereIn('id', $validated['ids'])->get();
    DB::transaction(function () use ($users, $validated) {
      foreach ($users as $user) {
        $user->update($validated);
      }
    });
    return back()->with('success', 'User updated successfully.');
  }

  public function exportAsCsv(Request $request)
  {
    $validated = $request->validate([
      'ids' => ['required', 'string'],
    ]);

    $userIds = explode(',', $validated['ids']);

    $filename = 'users.csv';

    $headers = [
      'Content-Type' => 'text/csv',
    ];

    return response()->streamDownload(
      function () use ($userIds) {

        $file = fopen('php://output', 'w');

        fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

        fputcsv($file, [
          'ID',
          'Username',
          'Email',
          'Name',
          'Status',
          'Created At',
        ]);

        User::whereIn('id', $userIds)
          ->cursor()
          ->each(function ($user) use ($file) {

            fputcsv($file, [
              $user->id,
              $user->username,
              $user->email,
              $user->name,
              $user->status->value,
              $user->created_at->toDateTimeString(),
            ]);
          });

        fclose($file);
      },
      $filename,
      $headers
    );
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(string $id)
  {
    //
  }
}
