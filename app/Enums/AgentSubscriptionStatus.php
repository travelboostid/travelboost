<?php

namespace App\Enums;

enum AgentSubscriptionStatus: string
{
  case INACTIVE  = 'inactive';
  case ACTIVE = 'active';
  case EXPIRED = 'expired';
}
