<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class B2BRegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $country = $this->input('country');
        $taxIdRule = 'nullable|string|max:100';

        if (strtolower($country) === 'india' || $this->input('country_code') === 'IN') {
            // Apply GSTIN validation for India
            $taxIdRule = [
                'required',
                'regex:/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i'
            ];
        }

        return [
            'firstName'       => 'required|string|max:100',
            'lastName'        => 'required|string|max:100',
            'email'           => 'required|email|max:255',
            'companyName'     => 'required|string|max:255',
            'website'         => 'nullable|url|max:255',
            'taxId'           => $taxIdRule,
            'phone'           => 'nullable|string|max:50',
            'address'         => 'required|string|max:255',
            'city'            => 'required|string|max:100',
            'zip'             => 'required|string|max:20',
            'country'         => 'required|string|max:100',
            'businessDocument'=> 'nullable|file|mimes:pdf,png,jpeg,jpg|max:10240', // 10MB limit
            'notes'           => 'nullable|string|max:1000',
            'metafields'      => 'nullable',
            'shopify_customer_id' => 'nullable|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'taxId.regex' => 'The Tax ID / VAT Number must be a valid GSTIN format (e.g. 22AAAAA0000A1Z5).',
        ];
    }

    /**
     * Handle a failed validation attempt.
     *
     * @param  \Illuminate\Contracts\Validation\Validator  $validator
     * @return void
     *
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Validation errors occurred.',
                'errors'  => $validator->errors()
            ], 422)
        );
    }
}
