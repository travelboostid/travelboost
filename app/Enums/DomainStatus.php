<?php

namespace App\Enums;

enum DomainStatus: string
{
  case INACTIVE = 'inactive';
  case PENDING = 'pending';
  case ACTIVE = 'active';
}
