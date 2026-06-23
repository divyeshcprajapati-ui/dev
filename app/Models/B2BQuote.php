<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class B2BQuote extends Model
{
    use HasFactory;

    protected $table = 'b2b_quotes';

    protected $fillable = [
        'shop_domain',
        'quote_number',
        'status',
        'product_name',
        'original_price',
        'quoted_price',
        'quantity',
        'subtotal',
        'apply_to_future_orders',
        'expiration_date',
        'customer_name',
        'customer_email',
        'company_name',
        'company_location',
        'shipping_address',
        'billing_address',
    ];

    protected $casts = [
        'original_price' => 'float',
        'quoted_price' => 'float',
        'subtotal' => 'float',
        'apply_to_future_orders' => 'boolean',
        'expiration_date' => 'date:Y-m-d',
    ];
}
