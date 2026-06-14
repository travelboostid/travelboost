<?php

namespace App\Models;

use App\Enums\BookingStatus;
use App\Observers\BookingObserver;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Booking extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::observe(BookingObserver::class);
    }

    protected $fillable = [
        'booking_number',
        'user_id',
        'vendor_id',
        'agent_id',
        'tour_id',
        'departure_date',
        'status',
        'reserved_type',
        'reserved_expires_at',
        'pax_adult',
        'pax_child',
        'pax_infant',
        'total_price',
        'tax_rate',
        'tax_amount',
        'platform_fee',
        'commission_amount',
        'grand_total',
        'payment_mode',
        'contact_name',
        'contact_email',
        'contact_phone',
        'contact_notes',
        'invoice_number',
        'input_by_user_id',
        'input_by_company_id',
        'input_by_role',
    ];

    protected function casts(): array
    {
        return [
            'departure_date' => 'date',
            'status' => BookingStatus::class,
            'reserved_expires_at' => 'datetime',
            'total_price' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'platform_fee' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'grand_total' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'vendor_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'agent_id');
    }

    public function tour(): BelongsTo
    {
        return $this->belongsTo(Tour::class);
    }

    public function inputByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'input_by_user_id');
    }

    public function inputByCompany(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'input_by_company_id');
    }

    public function passengers(): HasMany
    {
        return $this->hasMany(BookingPassenger::class);
    }

    public function addons(): HasMany
    {
        return $this->hasMany(BookingAddon::class);
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(BookingRoom::class);
    }

    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    public function actionRequests(): HasMany
    {
        return $this->hasMany(BookingActionRequest::class);
    }
}
