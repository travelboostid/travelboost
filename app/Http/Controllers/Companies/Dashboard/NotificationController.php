<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
  public function index(Company $company)
  {
    $notifications = $company->notifications()->paginate(15);

    return Inertia::render('companies/dashboard/notifications/index', [
      'data' => $notifications,
    ]);
  }

  public function update(Request $request, Company $company, $id)
  {
    $notification = $company->notifications()->findOrFail($id);
    $notification->markAsRead();

    return back();
  }

  public function markAllAsRead(Company $company)
  {
    $company->unreadNotifications->markAsRead();

    return back();
  }

  public function destroy(Company $company, $id)
  {
    $notification = $company->notifications()->findOrFail($id);
    $notification->delete();

    return back();
  }
}
