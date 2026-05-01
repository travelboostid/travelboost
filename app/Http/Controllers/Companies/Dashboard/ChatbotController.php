<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\UpdateChatbotRequest;
use App\Models\Company;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ChatbotController extends Controller
{
  // Display the chatbot settings for the specified company
  public function show(Company $company)
  {

    $settings = $company->settings()->first();

    // Get the AI credit information
    $credit = $company->aiCredit()->first();

    return Inertia::render('companies/dashboard/chatbot/index', [
      'settings' => $settings, // Pass settings to the Inertia view
      'credit' => $credit,
      // Fetch the last 30 billing cycles ordered by date
      'dailyStats' => $company->aiUsageLogs()
        ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(user_cost) as cost'), DB::raw('COUNT(*) as num_interactions'))
        ->groupBy('date')
        ->orderBy('date')
        ->get(),
      // Calculate today's usage cost
      'usageCostToday' => $company->aiUsageLogs()->whereDate('created_at', now()->toDateString())->sum('user_cost'),
      // Calculate usage cost for the last 30 days
      'usageCostIn30Days' => $company->aiUsageLogs()->where('created_at', '>=', now()->subDays(30)->toDateString())->sum('user_cost'),
    ]);
  }

  // Update the chatbot settings for the specified company
  public function update(UpdateChatbotRequest $request, Company $company)
  {
    $validated = $request->validated(); // Validate the incoming request data
    $company->settings()->update($validated); // Update the company's settings with validated data

    return back(); // Redirect back to the previous page
  }
}
