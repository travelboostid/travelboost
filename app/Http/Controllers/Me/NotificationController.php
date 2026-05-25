<?php

namespace App\Http\Controllers\Me;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('me/notifications', [
            'data' => $notifications,
        ]);
    }

    public function update(Request $request, string $notification): RedirectResponse
    {
        $request->user()
            ->notifications()
            ->findOrFail($notification)
            ->markAsRead();

        return back();
    }

    public function markAllAsRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    }

    public function destroy(Request $request, string $notification): RedirectResponse
    {
        $request->user()
            ->notifications()
            ->findOrFail($notification)
            ->delete();

        return back();
    }
}
