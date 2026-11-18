<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class B2BShoppingListItem extends Model
{
    protected $table = 'b2b_shopping_list_items';

    protected $fillable = [
        'b2b_shopping_list_id',
        'product_title',
        'variant_id',
        'sku',
        'price',
        'quantity',
        'image_url',
    ];

    protected $casts = [
        'price' => 'float',
        'quantity' => 'integer',
    ];

    public function list()
    {
        return $this->belongsTo(B2BShoppingList::class, 'b2b_shopping_list_id');
    }
}
