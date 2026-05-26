<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingActionRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'requester_company_id',
        'requester_user_id',
        'target_action',
        'status',
        'reason',
        'reviewer_company_id',
        'reviewer_user_id',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function requesterCompany(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'requester_company_id');
    }

    public function requesterUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_user_id');
    }

    public function reviewerCompany(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'reviewer_company_id');
    }

    public function reviewerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_user_id');
    }
}
