@include ('emails.travelboost-message', [
    'title' => $headline,
    'preheader' => $intro,
    'eyebrow' => $eyebrow,
    'headline' => $headline,
    'intro' => $intro,
    'detailsTitle' => $detailsTitle ?? 'Details',
    'details' => $details,
    'actionLabel' => $actionLabel,
    'actionUrl' => $actionUrl,
    'closing' => $closing,
])
