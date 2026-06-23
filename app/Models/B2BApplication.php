<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class B2BApplication extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'b2b_applications';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'shop_domain',
        'first_name',
        'last_name',
        'email',
        'company_name',
        'website',
        'tax_id',
        'phone',
        'address',
        'city',
        'zip',
        'country',
        'business_document_path',
        'notes',
        'status',
        'metafields',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'metafields' => 'array',
    ];
}
