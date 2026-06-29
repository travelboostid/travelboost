<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CheckUserStatus
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (($user->status->value == 'inactive') && ! str_starts_with($request->path(), 'me/onboarding')) {
            return redirect('/me/onboarding');
        } elseif ($user->status->value != 'inactive' && str_starts_with($request->path(), 'me/onboarding')) {
            $url = $this->mainHostUrl($request, '/me');

            return $request->header('X-Inertia')
                ? Inertia::location($url)
                : redirect()->away($url);
        }

        return $next($request);
    }

    private function mainHostUrl(Request $request, string $path): string
    {
        $port = $request->getPort();
        $portSuffix = in_array($port, [80, 443], true) ? '' : ':'.$port;
        $mainHost = (string) env('APP_HOST', $request->getHost());

        return $request->getScheme().'://'.$mainHost.$portSuffix.$path;
    }
}
