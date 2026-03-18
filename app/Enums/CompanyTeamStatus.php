<?php

namespace App\Enums;

enum CompanyTeamStatus: string
{
  case PENDING  = 'pending';
  case ACTIVE = 'active';
  case REJECTED = 'rejected';
  case SUSPENDED = 'suspended';
}
