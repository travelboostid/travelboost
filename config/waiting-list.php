<?php

return [
    'offer_hours' => (int) env('TOUR_WAITING_LIST_OFFER_HOURS', 24),
    'notification_channels' => ['database', 'mail'],
];
