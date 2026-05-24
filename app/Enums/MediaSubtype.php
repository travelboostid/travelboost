<?php

namespace App\Enums;

enum MediaSubtype: string
{
    // IMAGE
    case TOUR_IMAGE = 'tour-image';
    case PHOTO = 'photo';

    // DOCUMENT
    case GENERAL_KNOWLEDGE_BASE_DOCUMENT = 'general-knowledge-base-document';
    case TOUR_DOCUMENT = 'tour-document';
    case IDENTITY_CARD = 'identity-card';

    // RAW/OTHER
    case OTHER = 'other';
}
