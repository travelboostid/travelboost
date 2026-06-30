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
        'passport_place_of_issue',
        'passport_issue_date',
        'passport_expiry_date',
        'visa_number',
        'passport_file_path',
        'visa_file_path',
        'visa_category_item_id',
        'visa_type_description',
        'visa_type_price',
        'visa_type_is_taxable',
        'price_category',
        'price_amount',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'gender' => UserGender::class,
            'dob' => 'date',
            'passport_issue_date' => 'date',
            'passport_expiry_date' => 'date',
            'visa_category_item_id' => 'integer',
            'visa_type_price' => 'decimal:2',
            'visa_type_is_taxable' => 'boolean',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function visaCategoryItem(): BelongsTo
    {
        return $this->belongsTo(VisaCategoryItem::class);
    }
}
