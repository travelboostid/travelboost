<?php

namespace App\Enums;

enum MediaImageSubtype: string
{
  case TOUR_IMAGE = 'tour-image';
  case PHOTO = 'photo';
  case OTHER = 'other';
}

enum MediaDocumentSubtype: string
{
  case TOUR_DOCUMENT = 'tour-document';
  case IDENTITY_CARD = 'identity-card';
  case OTHER = 'other';
}

enum MediaRawSubtype: string
{
  case OTHER = 'other';
}
