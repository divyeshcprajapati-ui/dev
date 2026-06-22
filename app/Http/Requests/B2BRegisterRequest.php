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
        return [
            'firstName'       => 'required|string|max:100',
            'lastName'        => 'required|string|max:100',
            'email'           => 'required|email|max:255',
            'companyName'     => 'required|string|max:255',
            'website'         => 'nullable|url|max:255',
            'taxId'           => 'nullable|string|max:100',
            'phone'           => 'nullable|string|max:50',
            'address'         => 'required|string|max:255',
            'city'            => 'required|string|max:100',
            'zip'             => 'required|string|max:20',
            'country'         => 'required|string|max:100',
            'businessDocument'=> 'nullable|file|mimes:pdf,png,jpeg,jpg|max:10240', // 10MB limit
            'notes'           => 'nullable|string|max:1000',
            'metafields'      => 'nullable',
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
