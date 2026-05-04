<?php

namespace App\Events;

use App\Models\CompanyTeam;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CompanyTeamCreated
{
  use Dispatchable, SerializesModels;

  public CompanyTeam $team;

  /**
   * Create a new event instance.
   */
  public function __construct(CompanyTeam $team)
  {
    $this->team = $team;
  }
}
