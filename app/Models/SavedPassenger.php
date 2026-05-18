<?php

namespace App\Models;

use App\Enums\UserGender;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedPassenger extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'first_name',
        'last_name',
        'gender',
        'dob',
        'pob',
        'passport_number',
        'passport_issue_date',
        'passport_expiry_date',
        'visa_number',
        'passport_file_path',
        'visa_file_path',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
