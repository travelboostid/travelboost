<?php

namespace App\Contracts;

use App\Enums\AdPlatform;
use App\Models\AdPlatformConnection;
use App\Models\Company;

interface AdPlatformService
{
    public function platform(): AdPlatform;

    public function connect(Company $company): AdPlatformConnection;

    public function disconnect(Company $company): void;

    public function isConfigured(): bool;
}
