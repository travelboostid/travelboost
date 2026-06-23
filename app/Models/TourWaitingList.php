<?php

namespace App\Models;

use App\Enums\TourWaitingListStatus;
use Database\Factories\TourWaitingListFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TourWaitingList extends Model
{
    /** @use HasFactory<TourWaitingListFactory> */
    use HasFactory;

    protected $fillable = [
        'tour_id',
        'vendor_id',
        'created_by_user_id',
        'created_by_company_id',
        'customer_user_id',
        'contact_name',
        'contact_phone',
        'contact_email',
        'contact_address',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => TourWaitingListStatus::class,
        ];
    }

    public function tour(): BelongsTo
    {
        return $this->belongsTo(Tour::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'vendor_id');
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function createdByCompany(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'created_by_company_id');
    }

    public function customerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_user_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(TourWaitingListSchedule::class);
    }
}
