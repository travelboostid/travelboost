<?php

namespace App\Enums;

enum UserStatus: string
{
  case INACTIVE = 'inactive';
  case PENDING = 'pending';
  case ACTIVE = 'active';
  case SUSPENDED = 'suspended';
  case REJECTED = 'rejected';
}
