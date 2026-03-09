<?php

namespace App\Enums;

enum CompanyTeamRole: string
{
  case SUPERADMIN  = 'superadmin';
  case ADMIN = 'admin';
  case OPERATOR = 'operator';
  case VIEWER = 'viewer';
}
