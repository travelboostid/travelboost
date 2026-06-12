<?php

namespace App\Http\Resources;

use App\Models\CompanySettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CompanySettings */
class CompanySettingsResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'chatbot_enabled' => $this->chatbot_enabled,
            'chatbot_response_style' => $this->chatbot_response_style,
            'chatbot_default_language' => $this->chatbot_default_language,
            'chatbot_model_code' => $this->chatbot_model_code,
            'landing_page_data' => $this->landing_page_data,
            'booking_deadline' => $this->booking_deadline,
            'minimum_down_payment' => $this->minimum_down_payment,
            'minimum_down_payment_value' => $this->minimum_down_payment_value,
            'minimum_vat' => $this->minimum_vat,
            'term_conditions' => $this->term_conditions,
            'booking_entry_time_limit' => $this->booking_entry_time_limit,
            'manual_bank_transfer' => $this->manual_bank_transfer,
            'manual_bank_transfer_account_name' => $this->manual_bank_transfer_account_name,
            'manual_bank_transfer_account_number' => $this->manual_bank_transfer_account_number,
            'email_payment_gateway' => $this->email_payment_gateway,
            'password_payment_gateway' => $this->password_payment_gateway,
            'full_payment_deadline' => $this->full_payment_deadline,
            'document_completed_deadline' => $this->document_completed_deadline,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
