<?php

test('guests can view the docs page', function () {
    $this->withoutVite();

    $response = $this->get('/docs');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('docs/index')
        ->where('topic', null));
});

test('docs page accepts a topic query parameter', function () {
    $this->withoutVite();

    $response = $this->get('/docs?topic=bookings');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('docs/index')
        ->where('topic', 'bookings'));
});
