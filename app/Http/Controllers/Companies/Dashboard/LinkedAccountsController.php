<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\LinkedAccountsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LinkedAccountsController extends Controller
{
    public function __construct(
        private LinkedAccountsService $linkedAccountsService
    ) {}

    public function index(Request $request, Company $company)
    {
        return Inertia::render('companies/dashboard/linked-accounts/index', [
            'accountGroups' => $this->linkedAccountsService->getAccountGroups($company),
        ]);
    }
}
