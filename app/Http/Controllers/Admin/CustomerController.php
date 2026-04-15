<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    /**
     * Display a listing of all customers (users) across the platform.
     */
    public function index(Request $request)
    {
        $data = User::query()
            ->whereNotNull('company_id')
            ->when($request->input('name'), function ($query, $name) {
                $query->where('name', 'like', "%$name%");
            })
            ->when($request->input('email'), function ($query, $email) {
                $query->where('email', 'like', "%$email%");
            })
            ->latest()
            ->paginate();

        return Inertia::render('admin/database/customers/index', [
            'data' => $data,
        ]);
    }
}
