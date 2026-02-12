<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserPreferenceResource extends JsonResource
{
  /**
   * @return array<string, mixed>
   */
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'meta_pixel_id' => $this->meta_pixel_id,
      'use_chatbot' => $this->use_chatbot,
      'landing_page_template_id' => $this->landing_page_template_id,
      'landing_page_template_data' => $this->landing_page_template_data,
      'updated_at' => $this->updated_at,
    ];
  }
}
