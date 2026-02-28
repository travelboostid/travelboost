<?php

namespace App\Enums;

enum CompanyUserStatus: string
{
  case PENDING  = 'pending';
  case ACTIVE = 'active';
}
