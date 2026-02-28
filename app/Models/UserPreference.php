<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class UserPreference extends Model
{
  use HasFactory;

  /**
   * The attributes that are mass assignable.
   * These fields can be set using mass assignment methods like create() or update().
   * 
   * @var array<string>
   */
  protected $fillable = [
    'meta_pixel_id',          // Facebook/Meta Pixel ID for tracking conversions
    'use_chatbot',            // Boolean flag to enable/disable chatbot functionality
    'user_id',                // Foreign key linking to the users table
    'landing_page_template_data' // JSON data storing customizations for the landing page template
  ];

  /**
   * Define the relationship with the User model.
   * This preference belongs to a single user.
   * 
   * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
   */
  public function user()
  {
    return $this->belongsTo(User::class, 'user_id');
  }

  /**
   * Note: If you plan to store JSON data in 'landing_page_template_data',
   * consider adding a cast to automatically handle JSON serialization/deserialization:
   * 
   * protected $casts = [
   *   'landing_page_template_data' => 'array',
   *   'use_chatbot' => 'boolean',
   * ];
   * 
   * This would allow you to store and retrieve the data as a PHP array automatically.
   */
}
