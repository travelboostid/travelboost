<?php

namespace App\Models;

use App\Enums\TourStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgentTour extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'tour_id',
        'agent_document_id',
        'company_id',
        'status',
    ];

    protected $casts = [
        'status' => TourStatus::class,
    ];

    protected $with = [
        'tour',
        'company',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id')->where('type', 'agent');
    }

    public function tour()
    {
        return $this->belongsTo(Tour::class, 'tour_id');
    }

    public function agentDocument()
    {
        return $this->belongsTo(Media::class, 'agent_document_id');
    }

    public function category()
    {
        return $this->belongsTo(TourCategory::class, 'category_id');
    }
}
