<?php

namespace App\Models;

use App\Enums\UserGender;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingPassenger extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'title',
        'first_name',
        'last_name',
        'gender',
        'dob',
        'pob',
        'nationality',
        'room_type',
        'room_number',
        'passport_number',
        'passport_issue_date',
        'passport_expiry_date',
        'visa_number',
        'passport_file_path',
        'visa_file_path',
        'price_category',
        'price_amount',
    ];

    protected function casts(): array
    {
        return [
            'gender' => UserGender::class,
            'dob' => 'date',
            'passport_issue_date' => 'date',
            'passport_expiry_date' => 'date',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
