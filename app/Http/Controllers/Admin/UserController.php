<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexUserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(IndexUserRequest $request)
    {
        $validated = $request->validated();
        $data = User::query()
            ->with(['company'])
            ->when($validated['name'] ?? null, function ($query, $name) {
                $query->where('name', 'like', "%$name%");
            })
            ->when($validated['email'] ?? null, function ($query, $email) {
                $query->where('email', 'like', "%$email%");
            })
            ->when($validated['username'] ?? null, function ($query, $username) {
                $query->where('username', 'like', "%$username%");
            })
            ->when($validated['phone'] ?? null, function ($query, $phone) {
                $query->where('phone', 'like', "%$phone%");
            })
            ->when($validated['address'] ?? null, function ($query, $address) {
                $query->where('address', 'like', "%$address%");
            })
            ->paginate();

        return Inertia::render('admin/database/users/index', [
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
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
