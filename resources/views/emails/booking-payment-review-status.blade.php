@include ('emails.travelboost-message', [
    'title' => $headline,
    'preheader' => $intro,
    'eyebrow' => $eyebrow,
    'headline' => $headline,
    'intro' => $intro,
    'detailsTitle' => 'Payment Review Details',
    'details' => $details,
    'actionLabel' => $actionLabel,
    'actionUrl' => $actionUrl,
    'closing' => $closing,
])
