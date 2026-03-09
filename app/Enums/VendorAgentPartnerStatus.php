<?php

namespace App\Enums;

enum VendorAgentPartnerStatus: string
{
  case PENDING  = 'pending';
  case ACTIVE = 'active';
  case REJECTED = 'rejected';
  case SUSPENDED = 'suspended';
}
