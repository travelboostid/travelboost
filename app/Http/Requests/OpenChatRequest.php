<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OpenChatRequest extends FormRequest
{
  /**
   * Determine if the user is authorized to make this request.
   */
  public function authorize(): bool
  {
    return true;
  }

  /**
   * Get the validation rules that apply to the request.
   *
   * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
   */
  public function rules(): array
  {
    return [
      'recipient_type' => ['required', 'in:user,company,anonymous-user'], // Make sure these match your actual types
      'recipient_id' => [
        'required',
        'integer',
        match ($this->input('sender_type')) {
          'user' => Rule::exists('users', 'id'),
          'company' => Rule::exists('companies', 'id'),
          'anonymous-user' => Rule::exists('anonymous_users', 'id'),
          default => Rule::exists('users', 'id'), // Default to users if type is unknown
        }
      ],
      'sender_type' => ['required', 'in:user,company,anonymous-user'],
      'sender_id' => [
        'required',
        'integer',
        match ($this->input('sender_type')) {
          'user' => Rule::exists('users', 'id'),
          'company' => Rule::exists('companies', 'id'),
          'anonymous-user' => Rule::exists('anonymous_users', 'id'),
          default => Rule::exists('users', 'id'), // Default to users if type is unknown
        }
      ],
    ];
  }
}
