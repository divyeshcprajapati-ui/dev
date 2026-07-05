<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class B2BQuoteItem extends Model
{
    use HasFactory;

    protected $table = 'b2b_quote_items';

    protected $fillable = [
        'b2b_quote_id',
        'product_name',
        'original_price',
        'quoted_price',
        'quantity',
        'subtotal',
        'image_url',
    ];

    protected $casts = [
        'original_price' => 'float',
        'quoted_price' => 'float',
        'subtotal' => 'float',
    ];

    public function quote()
    {
        return $this->belongsTo(B2BQuote::class, 'b2b_quote_id');
    }
}
