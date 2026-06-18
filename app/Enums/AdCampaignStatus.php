<?php

namespace App\Enums;

enum AdCampaignStatus: string
{
    case Active = 'active';
    case Paused = 'paused';
    case Ended = 'ended';
    case Failed = 'failed';
}
