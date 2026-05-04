<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class WithdrawalController extends Controller
{
    public function approve()
    {
        return Inertia::render('admin/home/index');
    }
}
