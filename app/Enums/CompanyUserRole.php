<?php

namespace App\Enums;

enum CompanyUserRole: string
{
  case SUPERADMIN  = 'superadmin';
  case ADMIN = 'admin';
}
