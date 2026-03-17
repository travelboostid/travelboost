<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\UpdateChatbotRequest;
use App\Models\Company;
use Inertia\Inertia;

class ChatbotController extends Controller
{

  /**
   * Display the specified resource.
   */
  public function show(Company $company)
  {
    $settings = $company->settings()->first();
    // $credit = $company->aiCredit()->first();
    return Inertia::render('companies/dashboard/chatbot/index', [
      'settings' => $settings,
      // 'credit' => $credit,
    ]);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(UpdateChatbotRequest $request, Company $company)
  {
    $validated = $request->validated();
    $company->settings()->update($validated);

    return back();
  }
}
