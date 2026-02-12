<?php

namespace App\Enums;

enum UserType: string
{
  case Generic = 'generic';
  case Agent = 'agent';
  case Vendor = 'vendor';
}
