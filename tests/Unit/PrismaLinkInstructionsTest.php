<?php

use App\Services\PrismaLinkService;

test('prismalink extract instructions maps virtual account from va number list', function () {
    $service = app(PrismaLinkService::class);

    $instructions = $service->extractInstructions([
        'va_number_list' => json_encode([
            ['bank' => 'Mandiri', 'va' => '8903910101023459'],
            ['bank' => 'BCA', 'va' => '1234567890'],
        ]),
    ], 'bca_va', '014');

    expect($instructions)->toMatchArray([
        'instruction_type' => 'va',
        'bank' => 'bca',
        'va_number' => '1234567890',
        'bank_id' => '014',
    ]);
});

test('prismalink extract instructions maps qris data to renderable qr payload', function () {
    $service = app(PrismaLinkService::class);

    $instructions = $service->extractInstructions([
        'qris_data' => '00020101021126550014ID.CO.QRIS.WWW011893600914081234567890152040000530336054031005802ID5911MERCHANT1236007JAKARTA61051234562070703A056304ABCD',
    ], 'qr');

    expect($instructions)->toMatchArray([
        'instruction_type' => 'qris',
        'qr_data' => '00020101021126550014ID.CO.QRIS.WWW011893600914081234567890152040000530336054031005802ID5911MERCHANT1236007JAKARTA61051234562070703A056304ABCD',
    ]);
});

test('prismalink extract instructions maps embedded emv qris payload to qr data', function () {
    $service = app(PrismaLinkService::class);

    $instructions = $service->extractInstructions([
        'qris_data' => '9919003231006266850973600020101021226680016COM.NOBUBANK.WWW01199360050300000030900021408220000000 2450303UBE51440014ID.CO.QRIS.WWW0215ID20190822000010303UBE5204549953033605404500055020 15802ID5925PT. DOMPET UNIKAS INDONES6014Kab. Tangerang610515811625301140822000022963305031230617201908221840560010703A0163042904',
    ], 'qr');

    expect($instructions)->toMatchArray([
        'instruction_type' => 'qris',
        'qr_data' => '00020101021226680016COM.NOBUBANK.WWW011993600503000000309000214082200000002450303UBE51440014ID.CO.QRIS.WWW0215ID20190822000010303UBE520454995303360540450005502015802ID5925PT.DOMPETUNIKASINDONES6014Kab.Tangerang610515811625301140822000022963305031230617201908221840560010703A0163042904',
    ]);
});

test('prismalink extract instructions keeps remote qris image url', function () {
    $service = app(PrismaLinkService::class);

    $instructions = $service->extractInstructions([
        'qris_data' => 'https://gateway.example/qris.png',
    ], 'qr');

    expect($instructions)->toMatchArray([
        'instruction_type' => 'qris',
        'qr_url' => 'https://gateway.example/qris.png',
    ]);
});

test('prismalink extract instructions maps credit card payment page url to redirect', function () {
    $service = app(PrismaLinkService::class);

    $instructions = $service->extractInstructions([
        'payment_page_url' => '/paymentpage/web/payment-page/render-page?pgid=123&keyId=abc',
    ], 'credit-card');

    expect($instructions)->toMatchArray([
        'instruction_type' => 'redirect',
        'redirect_url' => 'https://secure2-staging.plink.co.id/paymentpage/web/payment-page/render-page?pgid=123&keyId=abc',
    ]);
});

test('prismalink extract instructions maps credit card form url to redirect', function () {
    $service = app(PrismaLinkService::class);

    $instructions = $service->extractInstructions([
        'creditcard_form_url' => '/creditcard/landingpage?keyId=session-token',
    ], 'credit-card');

    expect($instructions)->toMatchArray([
        'instruction_type' => 'redirect',
        'redirect_url' => 'https://secure2-staging.plink.co.id/creditcard/landingpage?keyId=session-token',
    ]);
});

test('prismalink extract instructions builds redirect from credit card session token fallback', function () {
    $service = app(PrismaLinkService::class);

    $instructions = $service->extractInstructions([
        'creditcard_session_token' => '6ab8eb77082640639b2349153d192ec7',
    ], 'credit-card');

    expect($instructions)->toMatchArray([
        'instruction_type' => 'redirect',
        'redirect_url' => 'https://secure2-staging.plink.co.id/creditcard/landingpage?keyId=6ab8eb77082640639b2349153d192ec7',
    ]);
});
