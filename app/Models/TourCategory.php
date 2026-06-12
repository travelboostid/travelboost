<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TourCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'position_no',
        'manual_reserved_limit_value',
        'manual_reserved_limit_unit',
        'company_id',
    ];

    protected $casts = [
        'manual_reserved_limit_value' => 'integer',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function tours()
    {
        return $this->hasMany(Tour::class);
    }

    public function agentTours()
    {
        return $this->hasMany(AgentTour::class);
    }

    public function getManualReservedLimitValueAttribute($value): int
    {
        return (int) ($value ?: 1);
    }

    public function getManualReservedLimitUnitAttribute($value): string
    {
        return $value ?: 'hour';
    }
}
