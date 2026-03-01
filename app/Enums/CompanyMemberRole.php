<?php

namespace App\Enums;

enum CompanyMemberRole: string
{
  case SUPERADMIN  = 'superadmin';
  case ADMIN = 'admin';
}
