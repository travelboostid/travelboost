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
        'first_name',
        'last_name',
        'gender',
        'dob',
        'pob',
        'room_type',
        'room_number',
        'passport_file_path',
        'visa_file_path',
    ];

    protected function casts(): array
    {
        return [
            'gender' => UserGender::class,
            'dob' => 'date',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
