<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CaddyController extends Controller
{
    /**
     * Used by Caddy on-demand TLS verification.
     *
     * Caddy will call:
     * /caddy/verify-domain?domain=example.com
     *
     * Return:
     * - 200 => allow certificate issuance
     * - 403 => reject certificate issuance
     */
    public function verifyDomain(Request $request)
    {
        // TODO: Check against database
        return response('OK', 200);
        // response('Forbidden', 403);
    }
}
