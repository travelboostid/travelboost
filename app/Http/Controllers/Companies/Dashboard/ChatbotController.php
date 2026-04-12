<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\UpdateChatbotRequest;
use App\Models\Company;
use Inertia\Inertia;

class ChatbotController extends Controller
{
  // Display the chatbot settings for the specified company
  public function show(Company $company)
  {
    $settings = $company->settings()->first(); // Retrieve the company's settings
    return Inertia::render('companies/dashboard/chatbot/index', [
      'settings' => $settings, // Pass settings to the Inertia view
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
