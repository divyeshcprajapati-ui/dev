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
        $country = strtolower(trim((string) $this->input('country', '')));
        $countryCode = strtoupper(trim((string) $this->input('country_code', '')));
        $taxIdRule = 'nullable|string|max:100';

        // Country-specific Tax ID / GSTIN / International VAT format validation
        if ($country === 'india' || $countryCode === 'IN') {
            $taxIdRule = [
                'required',
                'regex:/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i'
            ];
        } elseif (!empty($this->input('taxId'))) {
            $vatPatterns = [
                'united kingdom' => '/^(GB)?([0-9]{9}([0-9]{3})?|[A-Z]{2}[0-9]{3})$/i',
                'gb' => '/^(GB)?([0-9]{9}([0-9]{3})?|[A-Z]{2}[0-9]{3})$/i',
                'germany' => '/^(DE)?[0-9]{9}$/i',
                'de' => '/^(DE)?[0-9]{9}$/i',
                'france' => '/^(FR)?[0-9A-Z]{2}[0-9]{9}$/i',
                'fr' => '/^(FR)?[0-9A-Z]{2}[0-9]{9}$/i',
                'italy' => '/^(IT)?[0-9]{11}$/i',
                'it' => '/^(IT)?[0-9]{11}$/i',
                'spain' => '/^(ES)?[A-Z0-9][0-9]{7}[A-Z0-9]$/i',
                'es' => '/^(ES)?[A-Z0-9][0-9]{7}[A-Z0-9]$/i',
                'netherlands' => '/^(NL)?[0-9]{9}B[0-9]{2}$/i',
                'nl' => '/^(NL)?[0-9]{9}B[0-9]{2}$/i',
                'belgium' => '/^(BE)?0?[0-9]{9,10}$/i',
                'be' => '/^(BE)?0?[0-9]{9,10}$/i',
                'austria' => '/^(AT)?U[0-9]{8}$/i',
                'at' => '/^(AT)?U[0-9]{8}$/i',
                'poland' => '/^(PL)?[0-9]{10}$/i',
                'pl' => '/^(PL)?[0-9]{10}$/i',
                'sweden' => '/^(SE)?[0-9]{12}$/i',
                'se' => '/^(SE)?[0-9]{12}$/i',
                'ireland' => '/^(IE)?[0-9][A-Z0-9\+\*][0-9]{5}[A-Z]{1,2}$/i',
                'ie' => '/^(IE)?[0-9][A-Z0-9\+\*][0-9]{5}[A-Z]{1,2}$/i',
            ];

            $pattern = $vatPatterns[$country] ?? $vatPatterns[strtolower($countryCode)] ?? null;
            if ($pattern) {
                $taxIdRule = ['nullable', 'string', 'max:100', 'regex:' . $pattern];
            }
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
