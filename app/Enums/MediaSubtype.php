<?php

namespace App\Enums;

enum MediaImageSubtype: string
{
    case TOUR_IMAGE = 'tour_image';
    case PHOTO = 'photo';
    case OTHER = 'other';
}

enum MediaDocumentSubtype: string
{
    case TOUR_DOCUMENT = 'tour_document';
    case IDENTITY_CARD = 'identity_card';
    case OTHER = 'other';
}

enum MediaRawSubtype: string
{
    case OTHER = 'other';
}
