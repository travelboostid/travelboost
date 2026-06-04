<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TourAddOn extends Model
{
    use HasFactory;

    protected $table = 'tour_add_ons';

    protected $fillable = [
        'company_id',
        'tour_id',
        'schedule_id',
        'description',
        'price',
        'edit_status',
        'is_taxable',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'edit_status' => 'boolean',
        'is_taxable' => 'boolean',
    ];

    // ================= RELATIONS =================

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function tour()
    {
        return $this->belongsTo(Tour::class);
    }

    public function schedule()
    {
        return $this->belongsTo(TourSchedule::class, 'schedule_id');
    }
}
