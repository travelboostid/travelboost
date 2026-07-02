@include ('emails.travelboost-message', [
    'title' => $headline,
    'preheader' => $intro,
    'eyebrow' => 'TravelBoost Team Access',
    'headline' => $headline,
    'intro' => $intro,
    'detailsTitle' => 'Account Details',
    'details' => $details,
    'actionLabel' => 'Go to Company Login',
    'actionUrl' => $loginUrl,
    'closing' => $closing ?: 'If you did not expect this change, please contact your company owner or TravelBoost support immediately.',
])
