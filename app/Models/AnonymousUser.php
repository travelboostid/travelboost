<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnonymousUser extends Model
{
  protected $fillable = [
    'token',
  ];
}
