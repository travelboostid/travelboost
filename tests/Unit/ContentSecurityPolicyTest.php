<?php

use App\Support\ContentSecurityPolicy;

test('content security policy header includes midtrans snap inline hash', function () {
    config([
        'csp.enabled' => true,
        'csp.directives' => [
            'script-src' => [
                "'self'",
                "'sha256-DueWcbxgRVJl6J5x2OBGlMjJ0RI9aTrwDoqaA4GHDhs='",
            ],
        ],
    ]);

    $header = ContentSecurityPolicy::headerValue();

    expect($header)->toContain("script-src 'self'")
        ->and($header)->toContain('sha256-DueWcbxgRVJl6J5x2OBGlMjJ0RI9aTrwDoqaA4GHDhs=');
});

test('content security policy header includes request nonce', function () {
    config([
        'csp.enabled' => true,
        'csp.directives' => [
            'script-src' => ["'self'"],
        ],
    ]);

    ContentSecurityPolicy::setNonce('test-nonce-value');

    expect(ContentSecurityPolicy::headerValue())
        ->toContain("'nonce-test-nonce-value'");

    ContentSecurityPolicy::clearNonce();
});

test('web responses include content security policy when enabled', function () {
    config([
        'csp.enabled' => true,
        'csp.directives' => [
            'default-src' => ["'self'"],
            'script-src' => [
                "'self'",
                "'sha256-DueWcbxgRVJl6J5x2OBGlMjJ0RI9aTrwDoqaA4GHDhs='",
            ],
        ],
    ]);

    $response = $this->get('/login');

    $response->assertOk();
    $response->assertHeader('Content-Security-Policy');

    $policy = (string) $response->headers->get('Content-Security-Policy');

    expect($policy)
        ->toContain('sha256-DueWcbxgRVJl6J5x2OBGlMjJ0RI9aTrwDoqaA4GHDhs=')
        ->toContain('nonce-');
});

test('content security policy middleware does not override existing header', function () {
    config(['csp.enabled' => true]);

    Route::get('/csp-test-existing', function () {
        return response('ok')->header(
            'Content-Security-Policy',
            "script-src 'self'",
        );
    });

    $response = $this->get('/csp-test-existing');

    $response->assertOk();
    expect($response->headers->get('Content-Security-Policy'))->toBe("script-src 'self'");
});
